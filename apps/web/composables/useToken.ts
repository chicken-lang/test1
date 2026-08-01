/**
 * useToken - 后台管理员 Token 生命周期管理
 *
 * 对应《前端项目完善优化开发方案》4.4 节 Token 管理（解决 G6）+ 双轨令牌轨道 B。
 * 职责:
 *  1. 后台 DB Token 的存取（sessionStorage，非 localStorage，防 XSS）
 *  2. 过期检测与"即将过期"判断（< 10 分钟）
 *  3. 401001（Token 过期）触发静默刷新
 *  4. 401002（权限变更）触发强制重登（清除登录态 + 跳 /admin/login）
 *
 * 设计说明:
 *  - 仅客户端可用（sessionStorage 在 SSR 不可访问），所有方法内置 process.client 守卫
 *  - refreshToken 直接使用 $fetch，不依赖 useApi，避免循环依赖
 *  - 与 cmsAuth store 解耦：useToken 管理新轨道 B 的 token，
 *    cmsAuth 仍保留 localStorage（兼容现有后台），后续可统一迁移
 *  - useApi 读取 token 时优先 useToken（后台）→ cookie（前台）
 *
 * 后端 V2.0 错误码对应:
 *  - 401001: TOKEN_EXPIRED → refreshToken() 静默刷新
 *  - 401002: FORCED_RELOGIN → forceRelogin() 强制重登
 */

const TOKEN_KEY = 'jwc_admin_token'
const EXPIRE_KEY = 'jwc_admin_expire'
/** 即将过期阈值（毫秒）：10 分钟 */
const EXPIRING_THRESHOLD_MS = 10 * 60 * 1000

export const useToken = () => {
  /** 获取 Token（从 sessionStorage） */
  const getToken = (): string | null => {
    if (!import.meta.client) return null
    try {
      const token = sessionStorage.getItem(TOKEN_KEY)
      if (!token) return null
      // 校验是否已过期
      const expireStr = sessionStorage.getItem(EXPIRE_KEY)
      if (expireStr && Date.now() > Number(expireStr)) {
        // 已过期，主动清理
        clearToken()
        return null
      }
      return token
    } catch {
      return null
    }
  }

  /** 设置 Token + 过期时间（expiresIn 单位：秒） */
  const setToken = (token: string, expiresIn: number): void => {
    if (!import.meta.client) return
    try {
      sessionStorage.setItem(TOKEN_KEY, token)
      sessionStorage.setItem(EXPIRE_KEY, String(Date.now() + expiresIn * 1000))
    } catch {
      // sessionStorage 不可用（隐私模式等），静默忽略
    }
  }

  /** 清除 Token */
  const clearToken = (): void => {
    if (!import.meta.client) return
    try {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(EXPIRE_KEY)
    } catch {
      // ignore
    }
  }

  /** 是否即将过期（剩余时间 < 10 分钟） */
  const isExpiringSoon = (): boolean => {
    if (!import.meta.client) return false
    try {
      const expireStr = sessionStorage.getItem(EXPIRE_KEY)
      if (!expireStr) return true
      return Number(expireStr) - Date.now() < EXPIRING_THRESHOLD_MS
    } catch {
      return false
    }
  }

  /**
   * 静默刷新 Token（401001 触发）
   * 使用当前 token 调用 /api/auth/refresh，成功后更新 sessionStorage
   * @returns 是否刷新成功
   */
  const refreshToken = async (): Promise<boolean> => {
    if (!import.meta.client) return false
    const currentToken = getToken()
    if (!currentToken) return false
    try {
      const res = await $fetch<{ code: number; data?: { token: string; expiresIn: number } }>(
        '/api/auth/refresh',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        },
      )
      if (res?.code === 0 && res.data?.token) {
        setToken(res.data.token, res.data.expiresIn)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * 强制重登（401002 触发）
   * 清除登录态 + 弹窗提示 + 跳转 /admin/login
   * @param reason 提示文案
   * @param silent 静默模式：仅清 token + 跳登录页，不弹 ElMessageBox。
   *               用于 401001 刷新失败等高频场景，避免轮询反复弹窗造成"一直闪登录失败"。
   */
  const forceRelogin = async (
    reason = '您的权限已变更，请重新登录',
    silent = false,
  ): Promise<void> => {
    clearToken()
    if (!import.meta.client) return
    if (silent) {
      navigateTo('/admin/login')
      return
    }
    try {
      const { ElMessageBox } = await import('element-plus')
      await ElMessageBox.alert(reason, '提示', {
        confirmButtonText: '重新登录',
        type: 'warning',
        callback: () => {
          navigateTo('/admin/login')
        },
      })
    } catch {
      // 用户关闭弹窗也跳转
      navigateTo('/admin/login')
    }
  }

  return { getToken, setToken, clearToken, isExpiringSoon, refreshToken, forceRelogin }
}
