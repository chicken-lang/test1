/**
 * 统计分析中心常量定义
 * 模块十二：统计分析中心
 * 涵盖栏目访问量、热门内容、文件下载、搜索热词四大统计场景
 */

// 事件类型枚举
export enum EventType {
  PAGE_VIEW = 'page_view',       // 页面访问
  FILE_DOWNLOAD = 'file_download', // 文件下载
  SEARCH = 'search',             // 搜索行为
  ARTICLE_VIEW = 'article_view', // 稿件浏览
}

// 设备类型枚举
export enum DeviceType {
  PC = 'pc',
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

// 用户类型枚举
export enum UserType {
  ANONYMOUS = 'anonymous',
  SSO = 'sso',
  ADMIN = 'admin',
}

// 时间粒度枚举
export enum Granularity {
  HOUR = 'hour',
  DAY = 'day',
  MONTH = 'month',
}

// 热门榜单类型枚举
export enum RankType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  TOTAL = 'total',
}

// 统计周期枚举
export enum Period {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

// 趋势变化枚举
export enum Trend {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
}

// 报表类型枚举
export enum ReportType {
  COLUMN_ACCESS = 'column_access',   // 栏目访问量报表
  HOT_ARTICLES = 'hot_articles',     // 热门内容报表
  DOWNLOAD_RANK = 'download_rank',   // 文件下载排行报表
  HOT_KEYWORDS = 'hot_keywords',     // 搜索热词报表
  COMPREHENSIVE = 'comprehensive',   // 综合统计报表
}

// 导出格式枚举
export enum ExportFormat {
  XLSX = 'xlsx',
  PDF = 'pdf',
}

// 推送周期枚举
export enum PushCycle {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

// 排序方式枚举
export enum SortBy {
  DAILY = 'daily',
  TOTAL = 'total',
}

// Redis 缓存 Key 前缀
export const REDIS_KEY_PREFIX = {
  HOT_RANK: 'stats:hot_rank:',           // 热门榜单缓存
  COLUMN_ACCESS: 'stats:column_access:',  // 栏目访问量缓存
  KEYWORD_TREND: 'stats:keyword_trend:', // 关键词趋势缓存
}

// 缓存过期时间（秒）
export const CACHE_TTL = {
  HOT_RANK: 3600,      // 1小时
  COLUMN_ACCESS: 600,  // 10分钟
  KEYWORD_TREND: 3600, // 1小时
}

// 分页默认值
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
}

// 导出文件有效期（分钟）
export const EXPORT_FILE_EXPIRE_MINUTES = 30

// 单次导出数据上限
export const EXPORT_MAX_RECORDS = 10000

// 角色数据权限范围
export const ROLE_DATA_SCOPE = {
  EDITOR: 'SELF_COLUMN',       // 编辑：仅本栏目
  REVIEWER: 'SELF_COLUMN',     // 审核：本栏目
  COLUMN_ADMIN: 'ALL_SITE',    // 栏目管理员：全站
  SYSTEM_ADMIN: 'ALL_SITE',    // 系统管理员：全站
}

// 停用词列表（过滤无意义关键词）
export const STOP_WORDS = [
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '什么', '怎么', '为什么', '如何', '哪里', '谁', '多少',
]
