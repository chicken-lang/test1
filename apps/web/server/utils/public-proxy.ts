/**
 * 公开路由代理工具 - 将 Nuxt Server Route 请求转发到 NestJS 后端公开 API
 * 
 * 与 backendProxy.ts (admin专用) 不同,此工具处理前台公开路由代理:
 * - 文章、轮播、办事指南、搜索、通知等公开数据接口
 * - 后端不可用时自动降级到 Mock 数据
 * - 支持 V2.0 字段映射
 * 
 * 公开 API 路径前缀: /api/v1/public/*
 */
import { getQuery, readBody } from 'h3'
import { mockBanners, mockArticlesList, mockArticleDetail, mockGuideList } from './mock-api'
import { mapArticleRow, mapArticleList, mapBanner, mapGuideItem } from './field-mapping'

const PUBLIC_BACKEND_URL = process.env.WEB_API_PROXY || process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
const API_PREFIX = '/api/v1'
const PUBLIC_PROXY_TIMEOUT = parseInt(process.env.PROXY_TIMEOUT || '10000', 10)
const ENABLE_PROXY = process.env.FRONTEND_PUBLIC_PROXY !== 'false'

/**
 * 公开路由代理配置
 * 定义哪些路径需要代理到后端,以及对应的 mock 降级函数
 */
interface ProxyRouteConfig {
  /** 后端路径 (相对路径,会拼接到 API_PREFIX) */
  backendPath: string
  /** HTTP 方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** Mock 降级处理函数 */
  mockHandler?: (event: any, query: any, body?: any) => any
  /** 字段映射函数 (用于将后端响应转换为前端格式) */
  mapper?: (data: any) => any
  /** 是否需要认证 */
  requiresAuth?: boolean
}

/**
 * 公开路由映射表
 * key 为前端路径, value 为代理配置
 */
const publicRouteMap: Record<string, ProxyRouteConfig> = {
  // ========== 文章相关 ==========
  '/articles': {
    backendPath: '/public/articles',
    method: 'GET',
    mockHandler: (event, query) => mockArticlesList(query.column_id, query.page, query.page_size),
    mapper: (data) => ({
      list: (data.list || []).map(mapArticleRow),
      total: data.total || 0,
      page: data.page || 1,
      pageSize: data.pageSize || 10,
    }),
  },
  '/articles/detail': {
    backendPath: '/public/articles',
    method: 'GET',
    mockHandler: (event, query) => mockArticleDetail(query.id),
    mapper: (data) => mapArticleRow(data),
  },

  // ========== 轮播 ==========
  '/banners': {
    backendPath: '/public/homepage-carousel',
    method: 'GET',
    mockHandler: () => mockBanners(),
    mapper: (data) => (Array.isArray(data) ? data.map(mapBanner) : []),
  },

  // ========== 办事指南 ==========
  '/guide': {
    backendPath: '/public/guide-items',
    method: 'GET',
    mockHandler: (event, query) => mockGuideList(query.slug),
    mapper: (data) => ({
      list: (data.list || []).map(mapGuideItem),
      total: data.total || 0,
    }),
  },

  // ========== 搜索 ==========
  '/search': {
    backendPath: '/public/search',
    method: 'GET',
    mockHandler: (event, query) => ({ results: [], total: 0 }),
  },
  '/search/suggestions': {
    backendPath: '/public/search/suggestions',
    method: 'GET',
    mockHandler: () => [],
  },

  // ========== 通知 ==========
  '/notices/student': {
    backendPath: '/public/notices/student',
    method: 'GET',
  },
  '/notices/teacher': {
    backendPath: '/public/notices/teacher',
    method: 'GET',
  },

  // ========== 新闻 ==========
  '/news': {
    backendPath: '/public/news',
    method: 'GET',
  },

  // ========== 热门/推荐 ==========
  '/hot-articles': {
    backendPath: '/public/articles/hot',
    method: 'GET',
  },
  '/recommend-articles': {
    backendPath: '/public/articles/recommend',
    method: 'GET',
  },

  // ========== 栏目 ==========
  '/columns': {
    backendPath: '/public/columns',
    method: 'GET',
  },
  '/columns/tree': {
    backendPath: '/public/columns/tree',
    method: 'GET',
  },

  // ========== 下载 ==========
  '/downloads': {
    backendPath: '/public/downloads',
    method: 'GET',
  },

  // ========== 校历/作息 ==========
  '/calendar': {
    backendPath: '/public/calendar',
    method: 'GET',
  },
  '/class-schedule': {
    backendPath: '/public/class-schedule',
    method: 'GET',
  },

  // ========== 部门介绍 ==========
  '/about': {
    backendPath: '/public/about',
    method: 'GET',
  },
  '/dept-leaders': {
    backendPath: '/public/dept-leaders',
    method: 'GET',
  },

  // ========== 其他 ==========
  '/quick-links': {
    backendPath: '/public/quick-links',
    method: 'GET',
  },
  '/common-info': {
    backendPath: '/public/common-info',
    method: 'GET',
  },
  '/report-info': {
    backendPath: '/public/report-info',
    method: 'GET',
  },
  '/course-construction': {
    backendPath: '/public/course-construction',
    method: 'GET',
  },
  '/disclosure-links': {
    backendPath: '/public/disclosure-links',
    method: 'GET',
  },
  '/sitemap': {
    backendPath: '/public/sitemap',
    method: 'GET',
  },
  '/hot-keywords': {
    backendPath: '/public/hot-keywords',
    method: 'GET',
  },
}

/**
 * 代理请求到 NestJS 后端公开 API
 * 
 * @param event H3Event
 * @param frontendPath 前端 API 路径 (如 /articles)
 * @param mapper 可选的额外字段映射函数
 * @returns 代理后的响应数据
 */
export async function proxyPublicRequest(
  event: any,
  frontendPath: string,
  mapper?: (data: any) => any,
): Promise<any> {
  const config = publicRouteMap[frontendPath]
  const query = getQuery(event)

  // 如果未启用代理或无配置,直接返回 mock
  if (!ENABLE_PROXY || !config) {
    return fallbackToMock(event, frontendPath, query)
  }

  const backendFullPath = `${PUBLIC_BACKEND_URL}${API_PREFIX}${config.backendPath}`

  const fetchOptions: any = {
    method: config.method,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: PUBLIC_PROXY_TIMEOUT,
  }

  // GET 请求附带查询参数
  if (config.method === 'GET' && Object.keys(query).length > 0) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
    }
    const qsStr = qs.toString()
    fetchOptions.url = `${backendFullPath}${qsStr ? '?' + qsStr : ''}`
  } else {
    fetchOptions.url = backendFullPath
  }

  // POST/PUT 请求附带请求体
  if (config.method === 'POST' || config.method === 'PUT') {
    try {
      const body = await readBody(event)
      if (body) fetchOptions.body = JSON.stringify(body)
    } catch {
      // 无请求体
    }
  }

  try {
    const result: any = await $fetch.raw(fetchOptions)
    const data: any = result._data || result

    if (data && data.code === 0) {
      const responseData = data.data ?? data
      // 应用字段映射
      const mappedData = mapper ? mapper(responseData) : responseData
      // 同时应用路由配置中的 mapper (如果有)
      const finalData = config.mapper ? config.mapper(mappedData) : mappedData
      
      return {
        code: 0,
        data: finalData,
        message: data.message || 'ok',
        timestamp: Date.now(),
      }
    }

    // 后端返回错误码,降级到 mock
    throw new Error(`Backend error: code=${(data as any)?.code}, message=${(data as any)?.message}`)
  } catch (err: any) {
    // 后端不可用或返回错误,降级到 mock
    const mockData = fallbackToMock(event, frontendPath, query)
    if (mockData !== null) {
      return mockData
    }

    // mock 也未命中,返回错误
    const status = err?.response?.status || err?.statusCode || 502
    const message = err?.data?.message || err?.message || '后端服务暂不可用'
    throw createError({ statusCode: status, message: message })
  }
}

/**
 * 降级到 Mock 数据
 */
function fallbackToMock(event: any, frontendPath: string, query: any): any {
  const config = publicRouteMap[frontendPath]
  
  // 路由有 mock 处理器
  if (config?.mockHandler) {
    try {
      const result = config.mockHandler(event, query)
      return {
        code: 0,
        data: result,
        message: 'ok (mock)',
        timestamp: Date.now(),
      }
    } catch {
      // mock 处理失败,继续
    }
  }

  // 尝试从 mock-api 查找通用 mock
  try {
    const result = findMockHandler(frontendPath, query)
    if (result !== null) {
      return {
        code: 0,
        data: result,
        message: 'ok (mock)',
        timestamp: Date.now(),
      }
    }
  } catch {
    // 通用 mock 也失败
  }

  // 返回空响应
  return {
    code: 0,
    data: null,
    message: 'ok (empty)',
    timestamp: Date.now(),
  }
}

/**
 * 通用 mock 查找
 */
function findMockHandler(path: string, query: any): any {
  // 这里可以扩展更多通用 mock 路由
  const mockHandlers: Record<string, () => any> = {
    '/articles': () => mockArticlesList(query.column_slug, query.page, query.page_size),
    '/articles/detail': () => mockArticleDetail(query.id),
    '/banners': () => mockBanners(),
    '/guide': () => mockGuideList(query.slug),
  }

  const handler = mockHandlers[path]
  if (handler) return handler()
  return null
}

/**
 * 检查后端可用性 (健康检查)
 */
export async function checkBackendHealth(): Promise<{
  available: boolean
  latencyMs: number
  message: string
}> {
  try {
    const start = Date.now()
    const result = await $fetch(`${PUBLIC_BACKEND_URL}${API_PREFIX}/health`, {
      method: 'GET',
      timeout: 3000,
    })
    const latency = Date.now() - start
    return {
      available: true,
      latencyMs: latency,
      message: '后端服务正常',
    }
  } catch (err: any) {
    return {
      available: false,
      latencyMs: 0,
      message: `后端不可用: ${err?.message || '连接失败'}`,
    }
  }
}

/**
 * 添加新的代理路由 (动态注册)
 */
export function registerProxyRoute(
  frontendPath: string,
  config: ProxyRouteConfig,
) {
  publicRouteMap[frontendPath] = config
}

export { publicRouteMap, PUBLIC_BACKEND_URL, API_PREFIX, ENABLE_PROXY, PUBLIC_PROXY_TIMEOUT }