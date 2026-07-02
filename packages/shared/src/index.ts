/**
 * @jwc/shared - 跨端共享模块入口
 *
 * 集中导出后端、CMS、用户端共用的类型、常量与工具函数,
 * 避免重复定义,保证三端协议一致。
 *
 * 严格对应 docs/API接口文档与后端对接方案.md 第 2 章通用约定 + 第 4 章数据类型。
 */

// ========== 通用响应格式 ==========

/**
 * 统一 API 响应格式(对应 API 文档 2.3 节)
 * timestamp 为毫秒时间戳;trace_id 可选,用于链路追踪
 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp: number
  trace_id?: string
}

/**
 * 分页响应(对应 API 文档 2.5 节)
 */
export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ========== 文章状态机 ==========

/**
 * 文章状态机(对应 T2.5 工作流)
 * 前端展示仅消费 published,其余状态由 CMS 管理
 */
export enum ArticleStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  ARCHIVED = 'archived',
}

// ========== 业务错误码 ==========

/**
 * 业务错误码体系(对应 API 文档 6.3 节,后端必须按此表实现)
 * 前端 useApi 会按此表分流处理(跳登录/提示/404 等)
 */
export const ErrorCode = {
  SUCCESS: 0,
  // 4xx 客户端错误
  BAD_REQUEST: 40001, // 参数校验失败
  BAD_REQUEST_FORMAT: 40002, // 参数格式错误
  UNAUTHORIZED: 40101, // 未登录
  TOKEN_EXPIRED: 40102, // Token 失效
  FORBIDDEN: 40301, // 无权限
  ACCOUNT_LOCKED: 40302, // 账号已锁定
  NOT_FOUND: 40401, // 资源不存在
  ROUTE_NOT_FOUND: 40402, // 路由不存在
  CONFLICT: 40901, // 资源已存在(如重复收藏)
  BUSINESS_RULE_VIOLATION: 42201, // 业务规则不通过
  RATE_LIMITED: 42901, // 请求过于频繁
  // 5xx 服务端错误
  INTERNAL_ERROR: 50001, // 服务器内部错误
  DATABASE_ERROR: 50002, // 数据库错误
  BAD_GATEWAY: 50201, // 网关错误
  SERVICE_UNAVAILABLE: 50301, // 服务不可用(维护中)
  GATEWAY_TIMEOUT: 50401, // 网关超时
} as const

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode]

// ========== 领域类型 re-export ==========
// 完整定义见 ./types,对应 API 文档第 4 章
export * from './types'
