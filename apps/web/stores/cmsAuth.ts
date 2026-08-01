// ====================================================================
// CMS 认证 + RBAC 权限 Store
// 覆盖: 登录(RSA 加密传输 + NestJS 后端)、会话管理、权限校验、localStorage 持久化
// RSA 加密逻辑已提取至 composables/useCrypto.ts（T2.2），本 Store 仅调用
// ====================================================================
import { defineStore } from 'pinia'
import {
  AdminRole,
  RolePermissions,
  SessionRules,
  PasswordRules,
  type AdminUser,
  type LoginResult,
} from '~/utils/types'
import { useCrypto, clearRsaKeyCache } from '~/composables/useCrypto'

const AUTH_STORAGE_KEY = 'sziit-cms-auth'

/** 从 localStorage 恢复认证状态 */
function loadAuthFromStorage(): Partial<AuthState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    if (data.sessionExpiresAt && new Date(data.sessionExpiresAt).getTime() > Date.now()) {
      return {
        token: data.token,
        refreshToken: data.refreshToken,
        user: data.user,
        sessionExpiresAt: data.sessionExpiresAt,
      }
    }
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // ignore
  }
  return {}
}

/** 保存认证状态到 localStorage */
function saveAuthToStorage(state: AuthState) {
  if (typeof window === 'undefined') return
  try {
    if (state.token && state.user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        sessionExpiresAt: state.sessionExpiresAt,
      }))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

/**
 * 将后端返回的 user 对象映射为前端 AdminUser 类型
 */
function mapBackendUser(backendUser: any): AdminUser {
  const role = (backendUser.role as AdminRole)
  const validRoles = Object.values(AdminRole) as string[]
  return {
    id: backendUser.id,
    staffId: backendUser.union_id || backendUser.username,
    username: backendUser.username,
    realName: backendUser.nickname || backendUser.username,
    role: validRoles.includes(role) ? role : AdminRole.EDITOR,
    department: backendUser.department || '',
    bindColumnIds: backendUser.bind_column_ids || backendUser.bindColumnIds || [],
    phone: backendUser.phone || '',
    email: backendUser.email || '',
    status: backendUser.status || 'active',
    failedLoginAttempts: 0,
    passwordChangedAt: backendUser.passwordChangedAt || '',
    createdAt: backendUser.createdAt || '',
  }
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AdminUser | null
  sessionExpiresAt: string | null
  /** 后端返回的权限列表 */
  permissions: string[]
  /** 最后活动时间 */
  lastActivityAt: number
  /** 闲置检测定时器 */
  idleTimer: ReturnType<typeof setInterval> | null
}

export const useAuthStore = defineStore('cms-auth', {
  state: (): AuthState => ({
    token: null,
    refreshToken: null,
    user: null,
    sessionExpiresAt: null,
    permissions: [],
    lastActivityAt: Date.now(),
    idleTimer: null,
    ...loadAuthFromStorage(),
  }),

  getters: {
    isLoggedIn: (state): boolean => !!state.token && !!state.user,

    currentRole: (state): AdminRole | null => state.user?.role ?? null,

    hasPermission: (state) => {
      return (permission: string): boolean => {
        if (state.permissions.length > 0) {
          return state.permissions.includes(permission)
        }
        if (!state.user) return false
        const perms = RolePermissions[state.user.role] || []
        return perms.includes(permission)
      }
    },

    permissionsList: (state): string[] => {
      if (state.permissions.length > 0) return state.permissions
      if (!state.user) return []
      return RolePermissions[state.user.role] || []
    },

    isEditor: (state): boolean => state.user?.role === AdminRole.EDITOR,
    isReviewer: (state): boolean => state.user?.role === AdminRole.REVIEWER,
    isColumnAdmin: (state): boolean => state.user?.role === AdminRole.COLUMN_ADMIN,
    isSystemAdmin: (state): boolean => state.user?.role === AdminRole.SYSTEM_ADMIN,

    isContentReviewer: (state): boolean =>
      [AdminRole.EDITOR, AdminRole.REVIEWER, AdminRole.COLUMN_ADMIN].includes(state.user?.role as AdminRole),

    isPasswordExpiring: (state): boolean => {
      if (!state.user) return false
      const changedAt = new Date(state.user.passwordChangedAt)
      if (isNaN(changedAt.getTime())) return false
      const expiresAt = new Date(changedAt.getTime() + PasswordRules.rotationDays * 86400000)
      const daysUntilExpiry = (expiresAt.getTime() - Date.now()) / 86400000
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    },
  },

  actions: {
    /** 从 localStorage 恢复认证状态 */
    restoreAuth() {
      if (typeof window === 'undefined') return
      const saved = loadAuthFromStorage()
      if (saved.token && saved.user) {
        this.token = saved.token
        this.refreshToken = saved.refreshToken ?? null
        this.user = saved.user
        this.sessionExpiresAt = saved.sessionExpiresAt ?? null
        this.startIdleTimer()
      }
    },

    /** 更新当前用户资料字段（如 phone/email/nickname），并持久化到 localStorage */
    updateUserProfile(patch: Partial<AdminUser>) {
      if (!this.user) return
      this.user = { ...this.user, ...patch }
      saveAuthToStorage(this.$state)
    },

    /**
     * 预加载 RSA 公钥（登录页 onMounted 时调用）
     * 若后端未配置 RSA 密钥，静默降级到 SHA-256 兼容模式
     * 实际逻辑由 useCrypto composable 实现（T2.2 提取）
     */
    async preloadRsaKey() {
      const { preloadRsaKey } = useCrypto()
      await preloadRsaKey()
    },

    /**
     * 登录: RSA 加密传输 → NestJS 后端
     * 1. useCrypto().encrypt() 加密密码
     *    - 有公钥: RSA-OAEP 加密 → 发送 { password: "<base64>", keyVersion }
     *    - 无公钥/加密失败: SHA-256 哈希 → 发送 { password: "<sha256hex>" }（兼容模式）
     * 2. 调用后端 API
     * 3. 保存 token + 用户信息 + 权限
     * 接收 username/password 原始值(避免引用响应式 form 导致密码被清空)
     */
    async login(username: string, password: string): Promise<LoginResult> {
      // 1. 加密密码（RSA 优先，失败降级 SHA-256）
      const { encrypt } = useCrypto()
      const { cipher: passwordPayload, keyVersion } = await encrypt(password)

      // 2. 调用后端 API
      const body: Record<string, string> = {
        username,
        password: passwordPayload,
      }
      if (keyVersion) body.keyVersion = keyVersion

      const response = await $fetch<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response?.code !== 0) {
        throw new Error(response?.message || '登录失败')
      }

      const data = response.data
      const mappedUser = mapBackendUser(data.user)

      const result: LoginResult = {
        token: data.token,
        refreshToken: '',
        user: mappedUser,
        sessionExpiresAt: new Date(Date.now() + data.expiresIn * 1000).toISOString(),
      }

      this.setAuth(result)
      this.permissions = data.permissions || []
      this.startIdleTimer()

      return result
    },

    /**
     * SSO 校园统一身份认证登录
     */
    async loginWithSso(code: string): Promise<LoginResult> {
      const response = await $fetch<any>('/api/auth/sso/exchange', {
        method: 'POST',
        body: { code },
      })

      if (response?.code !== 0) {
        throw new Error(response?.message || '认证失败')
      }

      const data = response.data
      const mappedUser = mapBackendUser(data.user)

      const result: LoginResult = {
        token: data.token,
        refreshToken: '',
        user: mappedUser,
        sessionExpiresAt: new Date(Date.now() + data.expiresIn * 1000).toISOString(),
      }

      this.setAuth(result)
      this.permissions = data.permissions || []
      this.startIdleTimer()

      return result
    },

    setAuth(result: LoginResult) {
      this.token = result.token
      this.refreshToken = result.refreshToken
      this.user = result.user
      this.sessionExpiresAt = result.sessionExpiresAt
      this.lastActivityAt = Date.now()
      saveAuthToStorage(this)
      // 同步写入 sessionStorage 供 adminApi.ts / useToken 读取
      if (import.meta.client && result.token) {
        try {
          sessionStorage.setItem('jwc_admin_token', result.token)
          const expiresInMs = result.sessionExpiresAt
            ? new Date(result.sessionExpiresAt).getTime() - Date.now()
            : 7200 * 1000
          sessionStorage.setItem('jwc_admin_expire', String(Date.now() + expiresInMs))
        } catch {
          // ignore
        }
      }
    },

    touchActivity() {
      this.lastActivityAt = Date.now()
      this.sessionExpiresAt = new Date(
        Date.now() + SessionRules.idleTimeoutMinutes * 60000
      ).toISOString()
      saveAuthToStorage(this)
    },

    startIdleTimer() {
      this.stopIdleTimer()
      this.idleTimer = setInterval(() => {
        const elapsed = Date.now() - this.lastActivityAt
        if (elapsed > SessionRules.idleTimeoutMinutes * 60000) {
          this.logout('会话超时，请重新登录')
        }
      }, 30000)
    },

    stopIdleTimer() {
      if (this.idleTimer) {
        clearInterval(this.idleTimer)
        this.idleTimer = null
      }
    },

    async logout(reason?: string) {
      if (this.token) {
        try {
          await $fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.token}` },
          })
        } catch {
          // 即使后端调用失败也清除本地状态
        }
      }

      this.stopIdleTimer()
      this.token = null
      this.refreshToken = null
      this.user = null
      this.sessionExpiresAt = null
      this.permissions = []
      // 清除 RSA 公钥缓存（下次登录重新获取）
      clearRsaKeyCache()
      saveAuthToStorage(this)
      // 同步清除 sessionStorage
      if (import.meta.client) {
        try {
          sessionStorage.removeItem('jwc_admin_token')
          sessionStorage.removeItem('jwc_admin_expire')
        } catch {
          // ignore
        }
      }

      if (reason) {
        ElMessage.warning(reason)
      }
    },

    validatePassword(password: string): { valid: boolean; errors: string[] } {
      const errors: string[] = []
      if (password.length < PasswordRules.minLength) {
        errors.push(`至少${PasswordRules.minLength}位`)
      }
      if (PasswordRules.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('需包含大写字母')
      }
      if (PasswordRules.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('需包含小写字母')
      }
      if (PasswordRules.requireNumber && !/\d/.test(password)) {
        errors.push('需包含数字')
      }
      if (PasswordRules.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('需包含特殊符号')
      }
      return { valid: errors.length === 0, errors }
    },
  },
})
