// ====================================================================
// 管理员模块 API 封装
// 所有请求通过 Nuxt Server Route 代理到 NestJS 后端
// ====================================================================
import { ElMessage } from 'element-plus'

/** 管理员列表查询参数 */
export interface AdminListParams {
  page?: number
  pageSize?: number
  role?: string
  status?: string
  keyword?: string
}

/** 创建管理员请求体 */
export interface CreateAdminBody {
  username: string
  password: string
  nickname: string
  role: string
  bindColumnIds?: number[]
  email?: string
  phone?: string
}

/** 更新管理员请求体 */
export interface UpdateAdminBody {
  nickname?: string
  email?: string
  phone?: string
  role?: string
  bindColumnIds?: number[]
}

/** 通用 API 响应 */
interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

/** 分页响应 */
interface PaginatedResponse<T = any> {
  code: number
  data: {
    list: T[]
    total: number
    page: number
    pageSize: number
  }
  message: string
}

const ADMIN_TOKEN_KEY = 'jwc_admin_token'

/** 从 sessionStorage 获取管理员 token */
function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY)
  } catch {
    return null
  }
}

const $api = $fetch.create({
  baseURL: '/api',
  onRequest({ options }) {
    const token = getAdminToken()
    if (token) {
      options.headers = new Headers(options.headers)
      options.headers.set('Authorization', `Bearer ${token}`)
    }
  },
  onResponseError({ response }) {
    // 统一处理 401：token 失效/过期，清除并跳转登录页
    if (response.status === 401 && typeof window !== 'undefined') {
      // 防重入：并发请求会陆续返回 401，仅处理一次，避免连续弹窗/重复跳转
      // （典型场景：token 过期瞬间有 N 个后台请求并发发出，每个 onResponseError 都会触发 ElMessage）
      if (window.__adminAuthHandled) return
      window.__adminAuthHandled = true
      try { sessionStorage.removeItem(ADMIN_TOKEN_KEY) } catch {}
      // 同时清掉 cmsAuth store 的 localStorage 登录态，避免 middleware 恢复旧 token 反复重定向
      try { localStorage.removeItem('sziit-cms-auth') } catch {}
      // 避免在登录页重复跳转
      if (!window.location.pathname.startsWith('/admin/login')) {
        ElMessage.error('登录已过期，请重新登录')
        navigateTo('/admin/login', { replace: true })
      }
      // 5 秒后允许再次处理（用户登录回来重新触发 401 时）
      setTimeout(() => { window.__adminAuthHandled = false }, 5000)
    }
  },
})

// ========== 管理员账号管理 ==========

/** 获取管理员列表（分页/筛选） */
export function fetchAdminList(params: AdminListParams) {
  return $api<PaginatedResponse>('/admin', {
    method: 'GET',
    query: params,
  })
}

/** 获取单个管理员详情 */
export function fetchAdminDetail(id: number) {
  return $api<ApiResponse>(`/admin/${id}`, { method: 'GET' })
}

/** 创建管理员账号 */
export function createAdmin(body: CreateAdminBody) {
  return $api<ApiResponse>('/admin', { method: 'POST', body })
}

/** 更新管理员信息 */
export function updateAdmin(id: number, body: UpdateAdminBody) {
  return $api<ApiResponse>(`/admin/${id}`, { method: 'PUT', body })
}

/** 更新个人资料 (电话号码等) - 所有登录管理员均可调用,无需 ADMIN_MANAGE 权限 */
export function updateMyProfile(body: { phone?: string; nickname?: string }) {
  return $api<ApiResponse>('/auth/profile', { method: 'PUT', body })
}

/** 更新管理员角色及绑定栏目 */
export function updateAdminRole(id: number, body: { role: string; bindColumnIds: number[] }) {
  return $api<ApiResponse>(`/admin/${id}/role`, { method: 'PUT', body })
}

/** 冻结/解冻账号 */
export function toggleAdminFreeze(id: number, freeze: boolean) {
  return $api<ApiResponse>(`/admin/${id}/freeze`, { method: 'POST', body: { freeze } })
}

/** 重置密码 */
export function resetAdminPassword(id: number, body: { newPassword: string }) {
  return $api<ApiResponse>(`/admin/${id}/reset-password`, { method: 'POST', body })
}

/** 软删除管理员账号 */
export function deleteAdmin(id: number) {
  return $api<ApiResponse>(`/admin/${id}`, { method: 'DELETE' })
}

/** 批量分配栏目 */
export function batchBindColumns(body: { adminIds: number[]; bindColumnIds: number[] }) {
  return $api<ApiResponse>('/admin/batch-bind-columns', { method: 'POST', body })
}

// ========== 栏目树 ==========

/** 获取栏目树（用于下拉选择） */
export function fetchColumnTree() {
  return $api<ApiResponse>('/columns/tree', { method: 'GET' })
}

// ========== 角色权限管理 ==========

/** 获取所有角色权限 */
export function fetchAllPermissions() {
  return $api<ApiResponse>('/permission', { method: 'GET' })
}

/** 获取指定角色权限 */
export function fetchPermissionByRole(role: string) {
  return $api<ApiResponse>(`/permission/${role}`, { method: 'GET' })
}

/** 更新角色权限 */
export function updatePermission(role: string, body: { permissions: string[] }) {
  return $api<ApiResponse>(`/permission/${role}`, { method: 'PUT', body })
}

// ========== 审计日志 ==========

/** 查询审计日志（system_admin 可查看全站并按用户名/角色筛选） */
export function fetchMyAuditLogs(params?: { page?: number; pageSize?: number; action?: string; startDate?: string; endDate?: string; username?: string; filterRole?: string }) {
  return $api<PaginatedResponse>('/audit', { method: 'GET', query: params })
}

/** 查询越权违规记录 */
export function fetchAuditViolations(params?: { page?: number; pageSize?: number }) {
  return $api<PaginatedResponse>('/audit/violations', { method: 'GET', query: params })
}

/** 查询归档批次列表 */
export function fetchArchiveBatches(params?: { page?: number; pageSize?: number }) {
  return $api<PaginatedResponse>('/audit/batches', { method: 'GET', query: params })
}

/** 查询归档日志 */
export function fetchArchivedLogs(params?: { page?: number; pageSize?: number; startDate?: string; endDate?: string; action?: string }) {
  return $api<PaginatedResponse>('/audit/archived', { method: 'GET', query: params })
}

/** 手动触发归档 */
export function triggerArchive(body?: { days?: number }) {
  return $api<ApiResponse>('/audit/archive', { method: 'POST', body })
}

/** 恢复归档 */
export function restoreArchive(body: { batchId: number }) {
  return $api<ApiResponse>('/audit/restore', { method: 'POST', body })
}

/** 日志完整性校验（支持范围 + 抽样数量） */
export function verifyAuditIntegrity(params?: { scope?: 'main' | 'archive' | 'full'; sampleSize?: number }) {
  return $api<ApiResponse>('/audit/integrity-check', { method: 'GET', query: params })
}

/** 查询完整性校验历史记录 */
export function fetchIntegrityCheckHistory(params?: { page?: number; pageSize?: number; integrity?: string }) {
  return $api<PaginatedResponse>('/audit/integrity-check/history', { method: 'GET', query: params })
}

/** 查询篡改告警记录 */
export function fetchTamperAlerts(params?: { page?: number; pageSize?: number; status?: string }) {
  return $api<PaginatedResponse>('/audit/integrity-check/alerts', { method: 'GET', query: params })
}

/** 处理篡改告警（标记为已解决） */
export function resolveTamperAlert(id: number) {
  return $api<ApiResponse>(`/audit/integrity-check/alerts/${id}/resolve`, { method: 'POST' })
}

/** 重签全部日志（密钥轮换迁移） */
export function reSignAllLogs() {
  return $api<ApiResponse>('/audit/integrity-check/re-sign', { method: 'POST' })
}

// ========== 修改密码 ==========

/** 修改当前用户密码 */
export function changePassword(body: {
  oldPassword: string
  newPassword: string
  keyVersion?: string
}) {
  return $api<ApiResponse>('/auth/change-password', { method: 'POST', body })
}

// ========== 后台消息与统计 ==========

/** 获取当前用户未读消息数 */
export function fetchUnreadCount() {
  return $api<ApiResponse<{ count: number }>>('/admin/messages/unread-count', { method: 'GET' })
}

/** 获取工作台统计（各状态稿件数量） */
export function fetchDashboardStats() {
  return $api<ApiResponse<Record<string, number>>>('/admin/dashboard/stats', { method: 'GET' })
}

// ========== 稿件工作流（T2.5）==========
// 对齐后端 V2.0 4.2 节稿件 API,路径 /api/v1/articles
// 前端通过 /api/admin/articles 代理（server route 重写路径）

/** 稿件列表查询参数 */
export interface ArticleListParams {
  page?: number
  pageSize?: number
  status?: string
  type?: string
  column?: string
  authorId?: number
  keyword?: string
}

/** 创建草稿请求体 - 字段名必须与后端 CreateDraftDto 一致（驼峰）*/
export interface CreateDraftBody {
  title: string
  columnId: number
  content?: string
  summary?: string
  type?: 'normal' | 'confidential'
  secretLevel?: 'normal' | 'confidential'
  businessTags?: string[] | string
  roleTags?: string[] | string
  timeTags?: string[] | string
  images?: string
  attachments?: string
  expireDate?: string
}

/** 初审请求体 - 对齐后端 FirstReviewDto */
export interface FirstReviewBody {
  action: 'published' | 'review_rejected' | 'final_pending'
  reviewComment?: string
}

/** 终审请求体 - 对齐后端 FinalReviewDto */
export interface FinalReviewBody {
  action: 'published' | 'review_rejected'
  finalReviewComment?: string
  scheduledPublishAt?: string
}

/** 通用工作流请求体 */
export interface ReviewActionBody {
  comment?: string
  scheduledAt?: string
  reason?: string
}

/** 构建初审请求体（前端 approve/reject → 后端状态值） */
export function buildFirstReviewBody(
  action: 'approve' | 'reject',
  articleType: string,
  comment?: string,
): FirstReviewBody {
  if (action === 'reject') {
    return { action: 'review_rejected', reviewComment: comment }
  }
  // approve: 普通资讯直接发布, 涉密公文流转终审
  if (articleType === 'confidential') {
    return { action: 'final_pending', reviewComment: comment }
  }
  return { action: 'published', reviewComment: comment }
}

/** 构建终审请求体 */
export function buildFinalReviewBody(
  action: 'approve' | 'reject',
  comment?: string,
  scheduledAt?: string,
): FinalReviewBody {
  if (action === 'reject') {
    return { action: 'review_rejected', finalReviewComment: comment }
  }
  return { action: 'published', finalReviewComment: comment, scheduledPublishAt: scheduledAt }
}

/** 获取稿件列表（分页/筛选） - 通用入口 */
export function fetchArticleList(params: ArticleListParams) {
  return $api<PaginatedResponse>('/admin/articles', { method: 'GET', query: params })
}

/** 获取待初审稿件列表 */
export function fetchPendingReviewList(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return $api<PaginatedResponse>('/admin/articles/pending', { method: 'GET', query: params })
}

/** 获取待终审稿件列表 */
export function fetchFinalPendingList(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return $api<PaginatedResponse>('/admin/articles/final-pending', { method: 'GET', query: params })
}

/** 获取已发布稿件列表 */
export function fetchPublishedList(params?: { page?: number; pageSize?: number; keyword?: string; columnId?: number }) {
  return $api<PaginatedResponse>('/admin/articles/published', { method: 'GET', query: params })
}

/** 获取已驳回稿件列表 */
export function fetchRejectedList(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return $api<PaginatedResponse>('/admin/articles/rejected', { method: 'GET', query: params })
}

/** 获取我的草稿列表 */
export function fetchMyDrafts(params?: { page?: number; pageSize?: number; keyword?: string; column?: number }) {
  return $api<PaginatedResponse>('/admin/articles/draft', { method: 'GET', query: params })
}

/** 获取稿件详情 */
export function fetchArticleDetail(id: number) {
  return $api<ApiResponse>(`/admin/articles/${id}`, { method: 'GET' })
}

/** 创建草稿 */
export function createDraft(body: CreateDraftBody) {
  return $api<ApiResponse>('/admin/articles', { method: 'POST', body })
}

/** 更新草稿 */
export function updateDraft(id: number, body: Partial<CreateDraftBody>) {
  return $api<ApiResponse>(`/admin/articles/${id}`, { method: 'PUT', body })
}

/** 提交送审（编辑员 → 复审员） */
export function submitForReview(id: number, body: ReviewActionBody) {
  return $api<ApiResponse>(`/admin/articles/${id}/submit`, { method: 'POST', body })
}

/** 一级审核通过/驳回（复审员） */
export function firstReviewAction(id: number, body: FirstReviewBody) {
  return $api<ApiResponse>(`/admin/articles/${id}/review`, { method: 'POST', body })
}

/** 终审通过并发布（终审员） */
export function finalReviewAction(id: number, body: FinalReviewBody) {
  return $api<ApiResponse>(`/admin/articles/${id}/final-review`, { method: 'POST', body })
}

/** 驳回重提（复审员/终审员 → 编辑员） */
export function resubmitArticle(id: number, body: ReviewActionBody) {
  return $api<ApiResponse>(`/admin/articles/${id}/resubmit`, { method: 'POST', body })
}

/** 撤回已发布稿件 */
export function withdrawArticle(id: number, body: ReviewActionBody) {
  return $api<ApiResponse>(`/admin/articles/${id}/withdraw`, { method: 'POST', body })
}

/** 置顶 */
export function pinArticle(id: number, body: ReviewActionBody) {
  return $api<ApiResponse>(`/admin/articles/${id}/top`, { method: 'POST', body })
}

/** 取消置顶 */
export function unpinArticle(id: number) {
  return $api<ApiResponse>(`/admin/articles/${id}/unpin`, { method: 'POST' })
}

/** 删除草稿（仅草稿状态可删） */
export function deleteDraft(id: number) {
  return $api<ApiResponse>(`/admin/articles/${id}`, { method: 'DELETE' })
}

// ========== 栏目管理（V2.0 §5.3.3 + §5.3.4 + §5.6） ==========

/** 栏目树（管理员端，含全部状态，V2.0 标准字段） */
export function fetchAdminColumnTree() {
  return $api<ApiResponse>('/admin/columns/tree', { method: 'GET' })
}

/** 创建栏目（V2.0 §5.6 流程1） */
export function createColumn(body: {
  columnName: string
  columnSlug: string
  parentId?: number | null
  responsibleBusiness?: string
  sortOrder?: number
  description?: string
  linkUrl?: string
}) {
  return $api<ApiResponse>('/admin/columns', { method: 'POST', body })
}

/** 更新栏目（V2.0 §5.6 流程2） */
export function updateColumn(columnId: number, body: {
  columnName?: string
  columnSlug?: string
  responsibleBusiness?: string
  sortOrder?: number
  description?: string
  linkUrl?: string
  version?: number
}) {
  return $api<ApiResponse>(`/admin/columns/${columnId}`, { method: 'PUT', body })
}

/** 删除栏目 */
export function deleteColumn(columnId: number) {
  return $api<ApiResponse>(`/admin/columns/${columnId}`, { method: 'DELETE' })
}

/** 启用栏目 */
export function enableColumn(columnId: number) {
  return $api<ApiResponse>(`/admin/columns/${columnId}/enable`, { method: 'PUT' })
}

/** 停用栏目（V2.0 §5.4.3：若栏目下存在已发布稿件返回 40002） */
export function disableColumn(columnId: number) {
  return $api<ApiResponse>(`/admin/columns/${columnId}/disable`, { method: 'PUT' })
}

/** 栏目排序（V2.0 §5.6 流程3） */
export function sortColumns(body: { items: Array<{ columnId: number; sortOrder: number }> }) {
  return $api<ApiResponse>('/admin/columns/sort', { method: 'PUT', body })
}

// ----- V2.0 §5.3.4 双向映射接口（公开，供前台路由/权限校验使用） -----

/** slug → columnId 映射查询 */
export function fetchSlugToId(slug: string) {
  return $api<ApiResponse>('/columns/mapping/slug-to-id', { method: 'GET', query: { slug } })
}

/** columnId → slug 映射查询 */
export function fetchIdToSlug(columnId: number) {
  return $api<ApiResponse>('/columns/mapping/id-to-slug', { method: 'GET', query: { columnId } })
}

/** 批量映射（V2.0 §5.3.4） */
export function batchColumnMapping(body: {
  type: 'SLUG_TO_ID' | 'ID_TO_SLUG'
  values: (string | number)[]
}) {
  return $api<ApiResponse>('/columns/mapping/batch', { method: 'POST', body })
}

// ========== 信息公开目录管理（V2.0 §9.3.9 + 《高等学校信息公开办法》） ==========

/** 后台列表查询参数 */
export interface DisclosureListParams {
  page?: number
  pageSize?: number
  category?: string
  visibility?: string
  status?: string
  keyword?: string
}

/** 创建/更新请求体 */
export interface DisclosureItemBody {
  title: string
  slug: string
  category: string
  legalBasis?: string
  disclosureDeadline?: string
  disclosureMethod?: string
  content?: string
  summary?: string
  linkUrl?: string
  columnId?: number | null
  visibility?: 'PUBLIC' | 'CAMPUS' | 'INTERNAL'
  sortOrder?: number
}

/** 后台列表（分页） */
export function fetchDisclosureList(params: DisclosureListParams) {
  return $api<PaginatedResponse>('/admin/disclosure', { method: 'GET', query: params })
}

/** 详情 */
export function fetchDisclosureDetail(id: number) {
  return $api<ApiResponse>(`/admin/disclosure/${id}`, { method: 'GET' })
}

/** 创建 */
export function createDisclosureItem(body: DisclosureItemBody) {
  return $api<ApiResponse>('/admin/disclosure', { method: 'POST', body })
}

/** 更新 */
export function updateDisclosureItem(id: number, body: Partial<DisclosureItemBody>) {
  return $api<ApiResponse>(`/admin/disclosure/${id}`, { method: 'PUT', body })
}

/** 删除（逻辑删除） */
export function deleteDisclosureItem(id: number) {
  return $api<ApiResponse>(`/admin/disclosure/${id}`, { method: 'DELETE' })
}

/** 发布 */
export function publishDisclosureItem(id: number) {
  return $api<ApiResponse>(`/admin/disclosure/${id}/publish`, { method: 'PUT' })
}

/** 下线 */
export function offlineDisclosureItem(id: number) {
  return $api<ApiResponse>(`/admin/disclosure/${id}/offline`, { method: 'PUT' })
}

/** 批量排序 */
export function batchSortDisclosure(items: Array<{ id: number; sortOrder: number }>) {
  return $api<ApiResponse>('/admin/disclosure/sort', { method: 'PUT', body: { items } })
}

/** 批量状态变更 */
export function batchStatusDisclosure(ids: number[], action: 'PUBLISHED' | 'OFFLINE') {
  return $api<ApiResponse>('/admin/disclosure/batch-status', { method: 'PUT', body: { ids, action } })
}

// ========== 敏感词管理（V2.0 系统配置中心） ==========

/** 敏感词级别 */
export type SensitiveWordLevel = 'LOW' | 'HIGH'

/** 敏感词分类 */
export type SensitiveWordCategory =
  | 'political'
  | 'pornographic'
  | 'violent'
  | 'advertising'
  | 'other'

/** 敏感词列表查询参数 */
export interface SensitiveWordListParams {
  page?: number
  pageSize?: number
  level?: SensitiveWordLevel
  category?: string
  keyword?: string
}

/** 敏感词项（对齐 Prisma SensitiveWord 模型） */
export interface SensitiveWordItem {
  id: number
  word: string
  level: SensitiveWordLevel
  category: string
  replacement: string
  isActive: boolean
  createdBy: number | null
  createdAt: string
  updatedAt: string
}

/** 创建敏感词请求体 */
export interface CreateSensitiveWordBody {
  word: string
  level: SensitiveWordLevel
  category: string
  replacement?: string
}

/** 更新敏感词请求体 */
export interface UpdateSensitiveWordBody {
  word?: string
  level?: SensitiveWordLevel
  category?: string
  replacement?: string
  isActive?: boolean
}

/** 批量导入敏感词请求体 */
export interface BatchImportSensitiveWordBody {
  words: Array<{
    word: string
    level: SensitiveWordLevel
    category: string
    replacement?: string
  }>
}

/** 敏感词列表（分页） */
export function fetchSensitiveWordList(params: SensitiveWordListParams) {
  return $api<ApiResponse<{ items: SensitiveWordItem[]; total: number; page: number; pageSize: number }>>(
    '/admin/sensitive-words',
    { method: 'GET', query: params },
  )
}

/** 新增敏感词 */
export function createSensitiveWord(body: CreateSensitiveWordBody) {
  return $api<ApiResponse<SensitiveWordItem>>('/admin/sensitive-words', { method: 'POST', body })
}

/** 更新敏感词 */
export function updateSensitiveWord(id: number, body: UpdateSensitiveWordBody) {
  return $api<ApiResponse<SensitiveWordItem>>(`/admin/sensitive-words/${id}`, { method: 'POST', body })
}

/** 删除敏感词 */
export function deleteSensitiveWord(id: number) {
  return $api<ApiResponse>(`/admin/sensitive-words/${id}`, { method: 'DELETE' })
}

/** 切换敏感词启用状态 */
export function toggleSensitiveWord(id: number) {
  return $api<ApiResponse<SensitiveWordItem>>(`/admin/sensitive-words/${id}/toggle`, { method: 'POST' })
}

/** 批量导入敏感词 */
export function batchImportSensitiveWords(body: BatchImportSensitiveWordBody) {
  return $api<ApiResponse<{ imported: number; skipped: number }>>('/admin/sensitive-words/import', {
    method: 'POST',
    body,
  })
}

/** 预检测文本是否包含敏感词 */
export function checkSensitiveText(text: string) {
  return $api<ApiResponse<{ hasSensitiveWord: boolean; words: string[] }>>(
    '/admin/sensitive-words/check',
    { method: 'POST', body: { text } },
  )
}

// ========== 标签管理 ==========

/** 获取所有标签 */
export function fetchTags() {
  return $api<ApiResponse>('/admin/tags', { method: 'GET' })
}

/** 创建标签 */
export function createTag(body: { name: string; type: 'business' | 'role' | 'time' }) {
  return $api<ApiResponse>('/admin/tags', { method: 'POST', body })
}

/** 删除标签 */
export function deleteTag(id: number) {
  return $api<ApiResponse>(`/admin/tags/${id}`, { method: 'DELETE' })
}

// ========== 首页推荐位管理（V2.0 模块十七：轮播批量保存） ==========

/** 获取首页轮播推荐配置（全部位置） */
export function fetchCarouselConfig() {
  return $api<ApiResponse>('/admin/recommendations/carousel', { method: 'GET' })
}

/** 保存首页轮播推荐配置（批量） */
export function saveCarouselConfig(body: {
  positionCode: string
  items: { articleId: number; sortOrder: number; coverImageId?: number }[]
}) {
  return $api<ApiResponse>('/admin/recommendations/carousel', { method: 'POST', body })
}

/** 清空指定轮播推荐位 */
export function clearCarouselConfig(positionCode: string) {
  return $api<ApiResponse>(`/admin/recommendations/carousel/${positionCode}`, { method: 'DELETE' })
}

// ========== 文章推荐管理（首页推荐位） ==========

/** 获取可推荐文章列表 */
export function fetchRecommendableArticles(params?: { keyword?: string; page?: number; pageSize?: number }) {
  return $api<PaginatedResponse>('/admin/articles/published', { method: 'GET', query: params })
}

// ========== 统计分析 ==========

/** 全栏目访问统计(一次返回所有栏目 PV/UV, 替代 N+1 查询) */
export function fetchAllColumnStats(params?: { startDate?: string; endDate?: string }) {
  return $api<ApiResponse>('/stats/column-access/all', { method: 'GET', query: params })
}

/** 栏目访问统计(单栏目或全站汇总) */
export function fetchColumnStats(params?: { columnId?: number; startDate?: string; endDate?: string }) {
  return $api<ApiResponse>('/stats/column-access', { method: 'GET', query: params })
}

/** 热门稿件排行 */
export function fetchHotArticles(params?: { columnId?: number; limit?: number; startDate?: string; endDate?: string; page?: number; pageSize?: number }) {
  return $api<PaginatedResponse>('/stats/hot-articles', { method: 'GET', query: params })
}

/** 附件下载排行 */
export function fetchDownloadRank(params?: { columnId?: number; limit?: number; startDate?: string; endDate?: string; page?: number; pageSize?: number }) {
  return $api<PaginatedResponse>('/stats/download-rank', { method: 'GET', query: params })
}

/** 导出统计报表 */
export function fetchExportReport(body: { reportType: string; format: string; startDate?: string; endDate?: string; columnIds?: number[] }) {
  return $api<Blob>('/stats/export', { method: 'POST', body, responseType: 'blob' })
}
