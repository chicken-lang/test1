export const ArticleStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  ARCHIVED: 'archived',
}

export const ErrorCode = {
  SUCCESS: 0,
  BAD_REQUEST: 40001,
  BAD_REQUEST_FORMAT: 40002,
  UNAUTHORIZED: 40101,
  TOKEN_EXPIRED: 40102,
  FORBIDDEN: 40301,
  ACCOUNT_LOCKED: 40302,
  NOT_FOUND: 40401,
  ROUTE_NOT_FOUND: 40402,
  CONFLICT: 40901,
  BUSINESS_RULE_VIOLATION: 42201,
  RATE_LIMITED: 42901,
  INTERNAL_ERROR: 50001,
  DATABASE_ERROR: 50002,
  BAD_GATEWAY: 50201,
  SERVICE_UNAVAILABLE: 50301,
  GATEWAY_TIMEOUT: 50401,
}

export type ApiResponse<T = any> = {
  code: number
  message: string
  data: T | null
}

export type PaginatedData<T = any> = {
  list: T[]
  total: number
  page: number
  pageSize: number
}
