/**
 * @jwc/shared - 领域类型定义 (V2.0 标准)
 *
 * 严格对应《后端业务逻辑文档_整改定稿版V2.0》字段规范。
 * 
 * V2.0 字段命名规范:
 * - 文章标识: articleId (非 id)
 * - 发布时间: publishedAt (非 publishDate)
 * - 浏览量: viewCount (非 views)
 * - 栏目名称: columnName (非 columnTitle)
 * - 封面图: coverImageUrl (非 coverImage)
 * 
 * 前端 apps/web/types/api.ts 与后端 apps/server 共用此模块,
 * 保证三端协议一致,避免字段命名歧义。
 */

// ========== 文章 ==========
export interface ArticleListItem {
  articleId: number
  title: string
  summary: string
  publishedAt: string // '2026-06-30' ISO format
  source: string
  viewCount: number
  tags: string[]
  isTop: boolean
  isImportant: boolean
  hasAttachment: boolean
  columnSlug: string
  columnName: string
  coverImageUrl?: string
  // 兼容旧字段 (渐进迁移期)
  id?: number
  publishDate?: string
  views?: number
  columnTitle?: string
  coverUrl?: string
}

export interface ArticleDetail extends ArticleListItem {
  subtitle?: string
  author?: string
  content: string // 富文本 HTML
  attachments: Attachment[]
  contact?: string
  acceptTime?: string
  supervise?: string
  prev?: { articleId: number; title: string }
  next?: { articleId: number; title: string }
}

export interface Attachment {
  id: number
  name: string
  size: string // '32 KB'
  ext: string // 'pdf' | 'doc' | 'xls' | 'zip' | 'jpg' | 'png'
  downloadCount: number
  url: string
  // 兼容旧字段
  downloads?: number
}

// ========== 栏目 ==========
export interface ColumnCategory {
  slug: string
  title: string
  icon?: string
  description?: string
  parentId: string | null
  order: number
  articleCount: number
  children?: ColumnCategory[]
}

export interface FilterOptions {
  tags: string[]
  sources: string[]
  years: number[]
}

// ========== 搜索 ==========
export interface SearchResult {
  articleId: number
  title: string
  summary: string
  publishedAt: string
  source: string
  columnSlug: string
  columnName: string
  url: string
  highlight?: string
  // 兼容旧字段
  id?: number
  publishDate?: string
  columnTitle?: string
}

export interface HotKeyword {
  keyword: string
  count: number
  trend: 'up' | 'down' | 'flat'
}

// ========== 用户 ==========
export interface UserProfile {
  id: string
  name: string
  role: 'student' | 'teacher' | 'admin'
  roleLabel: string
  college: string
  major?: string
  grade?: string
  avatar: string
  email: string
  phone: string
}

export interface UserMessage {
  id: number
  title: string
  content: string
  date: string
  read: boolean
  type: 'system' | 'notice' | 'feedback'
  relatedUrl?: string
}

export interface UserFavorite {
  id: number
  articleId: number
  title: string
  url: string
  date: string
}

export interface UserHistory {
  id: number
  articleId: number
  title: string
  url: string
  date: string
}

export interface UserFeedback {
  id: number
  title: string
  type: string
  status: 'pending' | 'processing' | 'resolved'
  statusLabel: string
  date: string
  reply: string
}

export interface UserSubscription {
  id: number
  type: 'column' | 'tag'
  name: string
  active: boolean
}

export interface LoginResult {
  token: string
  expiresIn: number
  user: UserProfile
}

// ========== 反馈 ==========
export interface FeedbackType {
  value: string
  label: string
  icon: string
  description?: string
}

export interface FeedbackListItem {
  id: number
  title: string
  type: string
  status: 'pending' | 'processing' | 'resolved'
  statusLabel: string
  date: string
  reply: string
}

// ========== 下载 ==========
export interface DownloadCategory {
  value: string
  label: string
  order: number
}

export interface DownloadFile {
  id: number
  name: string
  category: string
  categoryLabel: string
  size: string
  ext: string
  uploadDate: string
  downloadCount: number
  url: string
  description?: string
}

// ========== 信息公开 ==========
export interface DisclosureDirectory {
  id: number
  title: string
  description: string
  icon: string
  articleCount: number
  children?: {
    id: number
    title: string
    articleCount: number
    columnSlug: string
  }[]
}

export interface DisclosureGuide {
  title: string
  content: string
  updatedAt: string
  sections: { title: string; content: string }[]
}

export interface DisclosureReport {
  year: number
  title: string
  content: string
  publishedAt: string
  attachments: Attachment[]
}

export interface DisclosureApplication {
  applicationNo: string
  status: 'pending' | 'processing' | 'resolved' | 'rejected'
  statusLabel: string
  submittedAt: string
  reply?: string
  replyAt?: string
}

// ========== 校历作息 ==========
export interface ClassSchedule {
  semester: string
  startDate: string
  endDate: string
  periods: {
    index: number
    name: string
    startTime: string
    endTime: string
  }[]
}

export interface SchoolCalendar {
  year: number
  semester: string
  events: {
    date: string
    title: string
    type: 'holiday' | 'exam' | 'event' | 'break'
    description?: string
  }[]
  pdfUrl?: string
}

export interface BusSchedule {
  route: string
  weekdays: { departure: string; arrival: string; remark?: string }[]
  weekends: { departure: string; arrival: string; remark?: string }[]
  notes: string[]
}

export interface DepartmentPhone {
  name: string
  phone: string
  location?: string
  businessScope?: string
  hours?: string
}

export interface CampusMap {
  imageUrl: string
  pdfUrl?: string
  externalUrl?: string
  buildings?: {
    name: string
    location: { x: number; y: number }
    description?: string
  }[]
}

// ========== 部门介绍 ==========
export interface DeptIntro {
  title: string
  content: string
  updatedAt: string
}

export interface DeptLeader {
  id: number
  name: string
  title: string
  division: string
  introduction?: string
  photo?: string
  email?: string
  order: number
}

export interface BusinessDivision {
  id: number
  name: string
  leader: string
  phone: string
  location: string
  duties: string[]
  staff?: DeptStaff[]
}

export interface DeptStaff {
  id: number
  name: string
  title: string
  phone?: string
  email?: string
}

export interface DeptContact {
  address: string
  phone: string
  email: string
  postalCode: string
  hours: string
  location: { longitude: number; latitude: number }
  mapUrl?: string
}

// ========== 站点地图 ==========
export interface SitemapCategory {
  title: string
  icon?: string
  links: {
    title: string
    url: string
    description?: string
    children?: { title: string; url: string }[]
  }[]
}

// ========== 首页配置 ==========
export interface Banner {
  id: number
  title: string
  subtitle?: string
  description?: string
  imageUrl: string
  linkUrl: string
  linkText?: string
  order: number
  startDate?: string
  endDate?: string
}

export interface QuickLink {
  id: number
  title: string
  icon: string
  url: string
  description?: string
  target?: '_self' | '_blank'
  order: number
}

export interface HomeSection {
  id: number
  title: string
  subtitle?: string
  columnSlug: string
  icon?: string
  displayMode: 'card' | 'list' | 'compact'
  limit: number
  moreUrl?: string
  order: number
}

// ========== 站点配置 ==========
export interface SiteConfig {
  siteName: string
  siteNameEn: string
  logoUrl: string
  icp: string
  publicSecurityRecord: string
  copyright: string
  contactPhone: string
  contactEmail: string
  serviceUrl?: string
}

// ========== 办事指南 (V2.0) ==========
export interface GuideItem {
  id: number
  title: string
  slug: string
  targetAudience: 'student' | 'teacher' | 'visitor'
  businessTag: string
  targetObject: string // JSON
  processSteps: string // JSON
  requiredMaterials: string // JSON
  timeLimit: string
  contactDept: string
  contactPhone?: string
  contactAddress?: string
  contactEmail?: string
  sortOrder: number
  status: 'draft' | 'published' | 'offline'
  viewCount: number
  createdAt: string
  updatedAt: string
}

// ========== 上传 ==========
export interface UploadResult {
  id: number
  name: string
  size: string
  ext: string
  url: string
}