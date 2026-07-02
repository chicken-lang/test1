/**
 * useApi - 统一 HTTP 客户端封装
 *
 * 对应 docs/API接口文档与后端对接方案.md 第 5.1 节。
 * 职责:
 *  1. 拼接 apiBase + url
 *  2. 注入 Authorization(从 cookie 读取 token)
 *  3. 解包 ApiResponse,code !== 0 抛业务错误
 *  4. 按 API 文档 6.3 错误码表分流(401 跳登录 / 404 抛 createError / 429 提示等)
 *  5. SSR 友好:server:true 由服务端发起请求避免 CORS
 *
 * 切换 mock → 真实 API 时,页面只需把 `import { getXxx } from '~/mock/data'`
 * 替换为 `const api = useApi(); const data = await api.get('/xxx')`,
 * 错误处理由本 composable 统一接管。
 */

import type { ApiResponse } from '@jwc/shared'
import { ErrorCode } from '@jwc/shared'

export const useApi = () => {
  const config = useRuntimeConfig()
  // HttpOnly cookie 优先;开发期也可用 localStorage 兜底
  const token = useCookie('token')

  const request = async <T>(
    url: string,
    options: Parameters<typeof $fetch>[1] = {},
  ): Promise<T> => {
    try {
      const res = await $fetch<ApiResponse<T>>(
        `${config.public.apiBase}${url}`,
        {
          ...options,
          headers: {
            ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
            ...options.headers,
          },
          // SSR 时由服务端发起,避免 CORS;同时利于首屏 SEO
          server: true,
        },
      )

      // 业务错误:code !== 0
      if (res.code !== ErrorCode.SUCCESS) {
        throw createApiError(res.code, res.message)
      }
      return res.data
    } catch (err: unknown) {
      // $fetch 网络错误 / HTTP 错误,err.data 携带后端 ApiResponse
      const fetchErr = err as { response?: { status: number }; data?: ApiResponse<unknown>; message?: string }
      const statusCode = fetchErr?.response?.status
      const businessCode = fetchErr?.data?.code
      const message = fetchErr?.data?.message || fetchErr?.message || '请求失败'

      // 401:未登录 / Token 失效 → 跳转登录页(携带 redirect)
      if (statusCode === 401 || businessCode === ErrorCode.UNAUTHORIZED || businessCode === ErrorCode.TOKEN_EXPIRED) {
        const route = useRoute()
        navigateTo(`/user?redirect=${encodeURIComponent(route.fullPath)}`)
        throw err
      }

      // 404:资源不存在 → 抛 createError 触发 Nuxt error.vue
      if (statusCode === 404 || businessCode === ErrorCode.NOT_FOUND) {
        throw createError({ statusCode: 404, statusMessage: '资源不存在', fatal: true })
      }

      // 403:无权限 → 提示并返回上一页
      if (statusCode === 403 || businessCode === ErrorCode.FORBIDDEN) {
        if (import.meta.client) {
          const { ElMessage } = await import('element-plus')
          ElMessage.error('您没有权限访问该资源')
        }
        throw err
      }

      // 429:限流 → 提示稍后再试
      if (statusCode === 429 || businessCode === ErrorCode.RATE_LIMITED) {
        if (import.meta.client) {
          const { ElMessage } = await import('element-plus')
          ElMessage.warning('请求过于频繁,请稍后再试')
        }
        throw err
      }

      // 503:维护中 → 渲染维护页(由 error.vue 根据 statusCode 处理)
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

/** 构造业务错误对象(内部使用) */
function createApiError(code: number, message: string): Error & { code: number } {
  const err = new Error(message) as Error & { code: number }
  err.code = code
  return err
}
