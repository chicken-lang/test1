/**
 * 通用后端代理工具 - 将 Nuxt Server Route 请求转发到 NestJS 后端
 * 
 * 支持:
 * - 自动携带 Authorization 头,透传查询参数和请求体
 * - V2.0 字段映射 (通过 field-mapping 工具)
 * - 后端不可用时自动降级到 Mock (管理后台)
 * - 支持 CORS 处理
 * - 可配置超时
 */
import { getRequestHeader, getQuery, readBody, setResponseStatus } from 'h3'
import { mockAdminResponse } from './admin-mock'
import { mapBackendToFrontend } from './field-mapping'

const BACKEND_URL = process.env.WEB_API_PROXY || process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
const PROXY_TIMEOUT = parseInt(process.env.PROXY_TIMEOUT || '10000', 10)

/**
 * 代理请求到 NestJS 后端
 * 
 * @param event H3Event
 * @param method HTTP 方法
 * @param backendPath 后端路径 (如 /api/v1/admin)
 * @param options 可选配置
 * @returns 代理后的响应数据
 */
export async function proxyToBackend(
  event: any,
  method: string,
  backendPath: string,
  options?: {
    /** 字段映射类型 (用于 V2.0 字段转换) */
    mapType?: 'article' | 'articleDetail' | 'listItem' | 'banner' | 'guide' | 'column' | 'columnTree'
    /** 是否降级到 mock (默认 false) */
    fallbackToMock?: boolean
    /** 超时时间(毫秒) */
    timeout?: number
  },
) {
  const { mapType, fallbackToMock = false, timeout = PROXY_TIMEOUT } = options || {}

  const authHeader = getRequestHeader(event, 'authorization')
  const query = getQuery(event)

  const fetchOptions: any = {
    method,
    headers: {
      'Authorization': authHeader || '',
    } as Record<string, string>,
    timeout,
  }

  // 附带查询参数（所有 HTTP 方法均透传）
  if (Object.keys(query).length > 0) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) qs.set(k, String(v))
    }
    const qsStr = qs.toString()
    if (qsStr) {
      const separator = backendPath.includes('?') ? '&' : '?'
      backendPath += `${separator}${qsStr}`
    }
  }

  // POST/PUT 请求附带请求体
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    try {
      const body = await readBody(event)
      if (body) {
        fetchOptions.body = body
        // 存储 body 到 event.context,供 mock 降级使用
        try {
          event.context.body = typeof body === 'string' ? JSON.parse(body) : body
        } catch {
          event.context.body = body
        }
      }
    } catch {
      // 无请求体
    }
  }

  try {
    const result = await $fetch(`${BACKEND_URL}${backendPath}`, fetchOptions)
    
    // 应用字段映射 (如果指定了类型)
    if (mapType && result?.data) {
      if (Array.isArray(result.data)) {
        result.data = result.data.map(item => mapBackendToFrontend(item, mapType))
      } else {
        result.data = mapBackendToFrontend(result.data, mapType)
      }
    }
    
    return result
  } catch (err: any) {
    // 后端请求失败，区分两类错误：
    //  1) 鉴权/授权类 (401/403)：属于业务错误，必须透传给前端（让 onResponseError 触发跳登录/权限提示），禁止降级到 Mock。
    //     否则无 token 时会被 Mock 顶替成 code:0 空列表，造成"接口没对接/数据异常"的假象。
    //  2) 连接/服务类 (5xx / ECONNREFUSED / 超时)：后端确实不可用，才降级到 Mock 保障开发体验。
    const status = err?.response?.status || err?.statusCode || 500
    const isAuthError = status === 401 || status === 403
    console.warn(`[proxyToBackend] Backend request failed: ${method} ${backendPath} → ${status}${isAuthError ? ' (auth error, no mock fallback)' : ''}`, err?.message || '')

    if (fallbackToMock && !isAuthError) {
      try {
        const mock = await mockAdminResponse(method, backendPath, event)
        if (mock !== undefined && mock !== null) {
          console.info(`[proxyToBackend] Mock fallback succeeded for: ${backendPath}`)
          return mock
        }
      } catch (mockErr: any) {
        console.error(`[proxyToBackend] Mock fallback threw for: ${backendPath}`, mockErr?.message || mockErr)
      }

      // Mock 降级也失败 → 返回安全兜底响应 (避免前端收到 500)
      console.warn(`[proxyToBackend] Returning safe fallback for: ${backendPath}`)
      return { code: 0, data: null, message: 'ok (mock fallback)' }
    }

    const message = err?.data?.message || err?.data?.error || err?.message || '请求失败'
    // 透传后端错误响应体（含业务错误码 code），供前端 resolveColumnError 映射友好提示
    // 不用 createError（其 data 字段会被嵌套，前端取不到顶层 code），改为 setResponseStatus + 返回后端响应体
    const backendData = err?.data || err?.response?._data
    console.warn(`[proxyToBackend] Backend error body for ${backendPath}:`, JSON.stringify(backendData))
    setResponseStatus(event, status)
    return backendData || { code: -1, message, data: null }
  }
}

/**
 * 代理公开 API 请求 (前台使用)
 * 与 proxyToBackend 不同:
 * - 不降级到 admin-mock,而是使用 public mock
 * - 支持更多的公开 API 路径
 */
export async function proxyPublicBackend(
  event: any,
  method: string,
  backendPath: string,
  options?: {
    mapType?: 'article' | 'articleDetail' | 'listItem' | 'banner' | 'guide' | 'column' | 'columnTree'
    fallbackHandler?: (event: any, query: any) => any
    timeout?: number
  },
) {
  const { mapType, fallbackHandler, timeout = PROXY_TIMEOUT } = options || {}

  const query = getQuery(event)

  const fetchOptions: any = {
    method,
    headers: { 'Content-Type': 'application/json' },
    timeout,
  }

  if (method === 'GET' && Object.keys(query).length > 0) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) qs.set(k, String(v))
    }
    const qsStr = qs.toString()
    if (qsStr) backendPath += `?${qsStr}`
  }

  try {
    const result = await $fetch(`${BACKEND_URL}${backendPath}`, fetchOptions)
    if (mapType && result?.data) {
      if (Array.isArray(result.data)) {
        result.data = result.data.map(item => mapBackendToFrontend(item, mapType))
      } else {
        result.data = mapBackendToFrontend(result.data, mapType)
      }
    }
    return result
  } catch {
    if (fallbackHandler) {
      return {
        code: 0,
        data: fallbackHandler(event, query),
        message: 'ok (mock)',
      }
    }
    throw createError({ statusCode: 502, message: '后端服务暂不可用' })
  }
}

export { BACKEND_URL, PROXY_TIMEOUT }