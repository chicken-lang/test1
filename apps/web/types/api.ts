/**
 * 前端 API 类型定义入口
 *
 * 领域类型统一从 @jwc/shared 导入,保证前后端协议一致。
 * 本文件仅补充前端专用类型(mock 查询辅助、UI 扩展字段),
 * 这些扩展字段不会出现在后端响应中,仅用于前端 mock 阶段。
 *
 * 对应文档:docs/API接口文档与后端对接方案.md 第 4 章
 */

// 领域类型:严格对应后端响应,前后端共享
export type {
  ApiResponse,
  PaginatedData,
  ArticleListItem,
  ArticleDetail,
  Attachment,
  ColumnCategory,
  FilterOptions,
  SearchResult,
  HotKeyword,
  UserProfile,
  UserMessage,
  UserFavorite,
  UserHistory,
  UserFeedback,
  UserSubscription,
  LoginResult,
  FeedbackType,
  FeedbackListItem,
  DownloadCategory,
  DownloadFile,
  DisclosureDirectory,
  DisclosureGuide,
  DisclosureReport,
  DisclosureApplication,
  ClassSchedule,
  SchoolCalendar,
  BusSchedule,
  DepartmentPhone,
  CampusMap,
  DeptIntro,
  DeptLeader,
  BusinessDivision,
  DeptStaff,
  DeptContact,
  SitemapCategory,
  Banner,
  QuickLink,
  HomeSection,
  SiteConfig,
  UploadResult,
} from '@jwc/shared'

// 枚举与常量
export { ArticleStatus, ErrorCode } from '@jwc/shared'
export type { ErrorCodeValue } from '@jwc/shared'

// ========== 前端专用扩展类型(mock 阶段辅助字段) ==========
// 以下字段仅用于前端 mock 查询/UI 展示,后端响应不包含这些字段。
// 切换真实 API 后,year/month 由 publishDate 派生,listStyle 由前端维护映射。

import type { ColumnCategory, ArticleListItem } from '@jwc/shared'

/**
 * 栏目(前端扩展):在 shared 基础上增加 listStyle,
 * 用于列表页选择卡片/表格/紧凑展示样式。后端不返回此字段,
 * 前端通过 slug → listStyle 的本地映射维护。
 */
export interface FrontendColumn extends ColumnCategory {
  listStyle: 'card' | 'table' | 'compact'
}

/**
 * 列表项(前端扩展):在 ArticleListItem 基础上增加 year/month/url,
 * 便于 mock 阶段的筛选与路由。切换真实 API 后:
 * - year/month 由 publishDate 派生
 * - url 由 `/article/${id}` 拼接
 */
export interface FrontendListItem extends ArticleListItem {
  year: number
  month: number
  url: string
}

/**
 * 侧边栏热门/推荐项(轻量)
 */
export interface SideItem {
  id: number
  title: string
  publishDate: string
  views: number
  url: string
}

/**
 * 列表查询参数(前端 → 后端 GET /articles 的 query)
 * 对应 API 文档 3.1.1,前端补充 year/month 本地筛选
 */
export interface ListQuery {
  columnSlug: string
  page: number
  pageSize: number
  year?: number
  month?: number
  tag?: string
}

/**
 * 列表查询结果(分页)
 */
export interface ListResult<T = FrontendListItem> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
