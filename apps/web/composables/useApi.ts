/**
 * useApi - 统一 HTTP 客户端封装
 *
 * 对应 docs/API接口文档与后端对接方案.md 第 5.1 节 + 《前端项目完善优化开发方案》4.2 错误码分流。
 * 职责:
 *  1. 拼接 apiBase + url
 *  2. 注入 Authorization（双源：后台 useToken sessionStorage → 前台 useCookie）
 *  3. 解包 ApiResponse，code !== 0 抛业务错误
 *  4. 错误码分流（同时支持 @jwc/shared 5 位码 + 后端 V2.0 6 位码）
 *     - 401001 Token 过期 → useToken.refreshToken() 静默刷新 + 重试一次
 *     - 401002 权限变更 → useToken.forceRelogin() 强制重登
 *     - 401003/401005 登录凭证/验证码错误 → 抛带 code 错误（登录页捕获）
 *     - 401004/401006 账号锁定/RSA 失败 → ElMessage 提示
 *     - 403001-003 权限不足 → ElMessage 差异化提示
 *     - 401/404/403/429/503 5 位码 → 原逻辑保留
 *  5. SSR 友好：server:true 由服务端发起请求避免 CORS
 *
 * 切换 mock → 真实 API 时，页面只需把 `import { getXxx } from '~/mock/data'`
 * 替换为 `const api = useApi(); const data = await api.get('/xxx')`，
 * 错误处理由本 composable 统一接管。
 */

import type { ApiResponse } from '@jwc/shared'
import { ErrorCode } from '@jwc/shared'
import { useToken } from '~/composables/useToken'

/**
 * 后端 V2.0 业务错误码（6 位数，对齐后端业务逻辑文档）
 * 与 @jwc/shared 的 5 位错误码并存，useApi 同时支持两套
 */
const BackendErrorCode = {
  TOKEN_EXPIRED: 401001,          // Token 过期 → 静默刷新
  FORCED_RELOGIN: 401002,         // 权限变更强制重登 → 清除登录态跳转
  INVALID_CREDENTIALS: 401003,    // 用户名密码错误 → 登录页显示
  ACCOUNT_LOCKED: 401004,         // 账号锁定 → 提示锁定时间
  CAPTCHA_ERROR: 401005,          // 验证码错误 → 登录页刷新验证码
  RSA_DECRYPT_FAILED: 401006,     // RSA 解密失败 → 提示刷新重试
  FUNC_PERMISSION_DENIED: 403001, // 功能权限不足
  DATA_PERMISSION_DENIED: 403002, // 数据权限不足
  CROSS_COLUMN_DENIED: 403003,    // 跨栏目操作禁止
} as const

export const useApi = () => {
  const config = useRuntimeConfig()
  // 前台师生 JWT（HttpOnly Cookie 由后端写入，同源 SSR 可读）
  const frontToken = useCookie('token')

  /**
   * 统一获取 Authorization token
   * 优先级：后台 useToken(sessionStorage) → 前台 useCookie('token')
   * 两套对应双轨令牌：轨道 B 后台 DB Token / 轨道 A 前台 JWT
   */
  const resolveAuthToken = (): string | null => {
    if (import.meta.client) {
      const adminToken = useToken().getToken()
      if (adminToken) return adminToken
    }
    return frontToken.value ?? null
  }

  /**
   * 单次请求
   * @param _retried 内部参数：是否已因 401001 重试过一次（防无限刷新循环）
   */
  const request = async <T>(
    url: string,
    options: Parameters<typeof $fetch>[1] = {},
    _retried = false,
  ): Promise<T> => {
    try {
      const res = await $fetch<ApiResponse<T>>(
        `${config.public.apiBase}${url}`,
        {
          ...options,
          headers: {
            ...(resolveAuthToken() ? { Authorization: `Bearer ${resolveAuthToken()}` } : {}),
            ...options.headers,
          },
          // SSR 时由服务端发起，避免 CORS；同时利于首屏 SEO
          server: true,
        },
      )

      // 业务错误：code !== 0 (兼容 V2.0 文档 code:200 成功标识)
      if (res.code !== ErrorCode.SUCCESS && res.code !== 200) {
        throw createApiError(res.code, res.message)
      }
      return res.data
    } catch (err: unknown) {
      // $fetch 网络错误 / HTTP 错误，err.data 携带后端 ApiResponse
      const fetchErr = err as { response?: { status: number }; data?: ApiResponse<unknown>; message?: string }
      const statusCode = fetchErr?.response?.status
      const businessCode = fetchErr?.data?.code
      const message = fetchErr?.data?.message || fetchErr?.message || '请求失败'

      // ===== 后端 V2.0 6 位错误码分流 =====

      // 401001: 后台 Token 过期 → 静默刷新 + 重试一次
      if (businessCode === BackendErrorCode.TOKEN_EXPIRED && !_retried) {
        const { refreshToken, forceRelogin } = useToken()
        const refreshed = await refreshToken()
        if (refreshed) {
          // 刷新成功，重试原请求（标记 _retried 防循环）
          return request<T>(url, options, true)
        }
        // 刷新失败（后端当前无 /api/auth/refresh 接口、无 refreshToken 机制）
        // → 直接清后台登录态并跳后台登录页，避免落入下方 401 通用分支被拽到前台登录页形成死循环闪烁
        if (import.meta.client) {
          const route = useRoute()
          if (route.path.startsWith('/admin')) {
            // 静默跳转：刷新失败多为 token 失效，轮询高频触发，弹窗会造成反复闪烁
            // 同时清掉 cmsAuth store 的 localStorage 登录态，否则 middleware 恢复旧 token 会无限重定向
            try {
              const { useAuthStore } = await import('~/stores/cmsAuth')
              const authStore = useAuthStore()
              authStore.token = null
              authStore.user = null
              authStore.refreshToken = null
              authStore.sessionExpiresAt = null
              localStorage.removeItem('sziit-cms-auth')
            } catch {
              // ignore
            }
            await forceRelogin('登录已失效，请重新登录', true)
            throw err
          }
        }
        // 非后台请求（前台师生端）/ SSR → 落入下方 401 通用处理
      }

      // 401002: 权限变更 → 强制重登（清 token + 弹窗 + 跳 /admin/login）
      if (businessCode === BackendErrorCode.FORCED_RELOGIN) {
        const { forceRelogin } = useToken()
        await forceRelogin(message || '您的权限已变更，请重新登录')
        throw err
      }

      // 401003: 用户名密码错误 → 抛带 code 错误，由登录页捕获显示（不弹通用 ElMessage）
      if (businessCode === BackendErrorCode.INVALID_CREDENTIALS) {
        throw createApiError(businessCode, message)
      }

      // 401004: 账号锁定 → 提示锁定时间（message 应含锁定时长）
      if (businessCode === BackendErrorCode.ACCOUNT_LOCKED) {
        if (import.meta.client) {
          const { ElMessage } = await import('element-plus')
          ElMessage.error(message || '账号已锁定，请联系管理员')
        }
        throw err
      }

      // 401005: 验证码错误 → 抛带 code 错误，由登录页捕获刷新验证码
      if (businessCode === BackendErrorCode.CAPTCHA_ERROR) {
        throw createApiError(businessCode, message)
      }

      // 401006: RSA 解密失败 → 提示刷新重试
      if (businessCode === BackendErrorCode.RSA_DECRYPT_FAILED) {
        if (import.meta.client) {
          const { ElMessage } = await import('element-plus')
          ElMessage.error('加密传输失败，请刷新页面后重试')
        }
        throw err
      }

      // 403001/403002/403003: 权限不足 → 差异化提示
      if (businessCode === BackendErrorCode.FUNC_PERMISSION_DENIED) {
        if (import.meta.client) {
          const { ElMessage } = await import('element-plus')
          ElMessage.error('您没有该功能的操作权限')
        }
        throw err
      }
      if (businessCode === BackendErrorCode.DATA_PERMISSION_DENIED) {
        if (import.meta.client) {
          const { ElMessage } = await import('element-plus')
          ElMessage.error('您无权操作该数据')
        }
        throw err
      }
      if (businessCode === BackendErrorCode.CROSS_COLUMN_DENIED) {
        if (import.meta.client) {
          const { ElMessage } = await import('element-plus')
          ElMessage.error('不可操作其他栏目的内容')
        }
        throw err
      }

      // ===== 5 位码 / HTTP 状态码分流（保留原逻辑） =====

      // 401: 未登录 / Token 失效 → 跳转登录页（携带 redirect）
      if (statusCode === 401 || businessCode === ErrorCode.UNAUTHORIZED || businessCode === ErrorCode.TOKEN_EXPIRED) {
        if (import.meta.client) {
          const route = useRoute()
          // 后台请求 → 跳后台登录页；前台师生请求 → 跳前台登录页
          if (route.path.startsWith('/admin')) {
            navigateTo(`/admin/login?redirect=${encodeURIComponent(route.fullPath)}`)
          } else {
            navigateTo(`/user?redirect=${encodeURIComponent(route.fullPath)}`)
          }
        }
        throw err
      }

      // 404: 资源不存在 → 抛 createError 触发 Nuxt error.vue
      // 不使用 fatal:true，避免 Nuxt payload 预加载失败（由调用方 .catch 处理或页面 createError 处理）
      if (statusCode === 404 || businessCode === ErrorCode.NOT_FOUND) {
        throw createError({ statusCode: 404, statusMessage: '资源不存在' })
      }

      // 403: 无权限 → 提示并返回上一页
      if (statusCode === 403 || businessCode === ErrorCode.FORBIDDEN) {
        if (import.meta.client) {
          const { ElMessage } = await import('element-plus')
          ElMessage.error('您没有权限访问该资源')
        }
        throw err
      }

      // 429: 限流 → 提示稍后再试
      if (statusCode === 429 || businessCode === ErrorCode.RATE_LIMITED) {
        if (import.meta.client) {
          const { ElMessage } = await import('element-plus')
          ElMessage.warning('请求过于频繁，请稍后再试')
        }
        throw err
      }

      // 503: 维护中 → 渲染维护页（由 error.vue 根据 statusCode 处理）
      if (statusCode === 503 || businessCode === ErrorCode.SERVICE_UNAVAILABLE) {
        throw createError({ statusCode: 503, statusMessage: '系统维护中', fatal: true })
      }

      // 其余业务/服务端错误 → ElMessage 提示
      if (import.meta.client) {
        const { ElMessage } = await import('element-plus')
        ElMessage.error(message)
      }
      throw err
    }
  }

  return {
    get: <T>(url: string, query?: Record<string, unknown>) =>
      request<T>(url, { method: 'GET', query }),
    post: <T>(url: string, body?: unknown) =>
      request<T>(url, { method: 'POST', body }),
    put: <T>(url: string, body?: unknown) =>
      request<T>(url, { method: 'PUT', body }),
    patch: <T>(url: string, body?: unknown) =>
      request<T>(url, { method: 'PATCH', body }),
    delete: <T>(url: string) =>
      request<T>(url, { method: 'DELETE' }),
  }
}

/** 构造业务错误对象（内部使用，带 code 供调用方判断） */
function createApiError(code: number, message: string): Error & { code: number } {
  const err = new Error(message) as Error & { code: number }
  err.code = code
  return err
}
