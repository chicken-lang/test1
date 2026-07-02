/**
 * @jwc/shared - 领域类型定义
 *
 * 严格对应 docs/API接口文档与后端对接方案.md 第 4 章。
 * 前端 apps/web/types/api.ts 与后端 apps/server 共用此模块,
 * 保证三端协议一致,避免字段命名歧义。
 */

// ========== 文章 ==========
export interface ArticleListItem {
  id: number
  title: string
  summary: string
  publishDate: string // '2026-06-30'
  source: string
  views: number
  tags: string[]
  isTop: boolean
  isImportant: boolean
  hasAttachment: boolean
  columnSlug: string
  columnTitle: string
  coverUrl?: string // 新闻类有封面
}

export interface ArticleDetail extends ArticleListItem {
  subtitle?: string
  author?: string
  content: string // 富文本 HTML
  attachments: Attachment[]
  contact?: string // 办事类文章的联系人
  acceptTime?: string // 办理时间
  supervise?: string // 监督方式
  prev?: { id: number; title: string }
  next?: { id: number; title: string }
}

export interface Attachment {
  id: number
  name: string
  size: string // '32 KB'
  ext: string // 'pdf' | 'doc' | 'xls' | 'zip' | 'jpg' | 'png'
  downloads: number
  url: string // 下载直链(带签名)
}

// ========== 栏目 ==========
export interface ColumnCategory {
  slug: string
  title: string
  icon?: string // mdi:xxx
  description?: string
  parentId: string | null // 父栏目 slug,顶级为 null
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
  id: number
  title: string
  summary: string
  publishDate: string
  source: string
  columnSlug: string
  columnTitle: string
  url: string // 前端路由,如 '/article/101'
  highlight?: string // 高亮片段(后端用 <em> 包裹关键词)
}

export interface HotKeyword {
  keyword: string
  count: number
  trend: 'up' | 'down' | 'flat'
}

// ========== 用户 ==========
export interface UserProfile {
  id: string // 学号/工号
  name: string
  role: 'student' | 'teacher' | 'admin'
  roleLabel: string // '学生' | '教师' | '管理员'
  college: string
  major?: string
  grade?: string
  avatar: string
  email: string
  phone: string // 脱敏显示
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
  id: number // 收藏记录 ID
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
  type: string // '建议' | '投诉' | '听课反馈' ...
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
  category: string // 分类 value
  categoryLabel: string // 分类显示名
  size: string
  ext: string
  uploadDate: string
  downloads: number
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
  title: string // '处长'
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

// ========== 上传 ==========
export interface UploadResult {
  id: number
  name: string
  size: string
  ext: string
  url: string
}
