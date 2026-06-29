/**
 * @jwc/shared - 跨端共享模块入口
 *
 * 集中导出后端、CMS、用户端共用的类型、常量与工具函数,
 * 避免重复定义,保证三端协议一致。
 */

// 统一 API 响应格式(对应需求文档第 8.3 节)
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  trace_id: string;
}

// 分页响应
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 文章状态机(对应 T2.5 工作流)
export enum ArticleStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  ARCHIVED = 'archived',
}

// 业务错误码体系(对应需求文档第 8.3 节)
export const ErrorCode = {
  SUCCESS: 0,
  // 4xx 客户端错误
  BAD_REQUEST: 40000,
  UNAUTHORIZED: 40100,
  TOKEN_EXPIRED: 40101,
  FORBIDDEN: 40300,
  NOT_FOUND: 40400,
  VALIDATION_FAILED: 42200,
  RATE_LIMITED: 42900,
  // 5xx 服务端错误
  INTERNAL_ERROR: 50000,
  SERVICE_UNAVAILABLE: 50300,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
