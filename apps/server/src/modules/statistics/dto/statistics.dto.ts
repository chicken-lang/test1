import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsInt, IsString, IsBoolean, IsArray } from 'class-validator'
import { Type, Transform } from 'class-transformer'

/**
 * 统计分析中心 DTO 定义
 * 模块十二：统计分析中心
 */

// ========== 栏目访问量统计 ==========

export class ColumnAccessQueryDto {
  @ApiProperty({ description: '栏目ID，不传则查询全站汇总', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  columnId?: number

  @ApiProperty({ description: '起始日期（YYYY-MM-DD），默认最近30天', required: false })
  @IsOptional()
  @IsString()
  startDate?: string

  @ApiProperty({ description: '结束日期（YYYY-MM-DD），默认今天', required: false })
  @IsOptional()
  @IsString()
  endDate?: string

  @ApiProperty({ description: '时间粒度：day（默认）/ hour / month', required: false, default: 'day' })
  @IsOptional()
  @IsString()
  granularity?: string
}

export class ColumnAccessDetailDto {
  @ApiProperty({ description: '日期' })
  date: string

  @ApiProperty({ description: 'PV数' })
  pv: number

  @ApiProperty({ description: 'UV数' })
  uv: number
}

export class ColumnInfoDto {
  @ApiProperty({ description: '栏目ID' })
  columnId: number

  @ApiProperty({ description: '栏目名称' })
  columnName: string
}

export class ColumnAccessResponseDto {
  @ApiProperty({ description: '汇总数据' })
  summary: {
    totalPV: number
    totalUV: number
  }

  @ApiProperty({ description: '详细数据列表' })
  details: ColumnAccessDetailDto[]

  @ApiProperty({ description: '栏目信息', required: false })
  columnInfo?: ColumnInfoDto
}

// ========== 热门内容统计 ==========

export class HotArticlesQueryDto {
  @ApiProperty({ description: '榜单类型：daily（默认）/ weekly / monthly / total', required: false, default: 'daily' })
  @IsOptional()
  @IsString()
  rankType?: string

  @ApiProperty({ description: '栏目ID筛选，不传则全站', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  columnId?: number

  @ApiProperty({ description: '返回条数，默认20，最大50', required: false, default: 20 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number
}

export class HotArticleItemDto {
  @ApiProperty({ description: '排名' })
  rank: number

  @ApiProperty({ description: '稿件ID' })
  articleId: number

  @ApiProperty({ description: '稿件标题' })
  title: string

  @ApiProperty({ description: '栏目ID' })
  columnId: number

  @ApiProperty({ description: '栏目名称' })
  columnName: string

  @ApiProperty({ description: '浏览次数' })
  viewCount: number

  @ApiProperty({ description: '发布时间', nullable: true })
  publishedAt?: string
}

export class HotArticlesResponseDto {
  @ApiProperty({ description: '榜单类型' })
  rankType: string

  @ApiProperty({ description: '生成时间' })
  generatedAt: string

  @ApiProperty({ description: '热门文章列表' })
  list: HotArticleItemDto[]
}

// ========== 稿件访问趋势 ==========

export class ArticleTrendQueryDto {
  @ApiProperty({ description: '稿件ID', required: true })
  @IsInt()
  @Type(() => Number)
  articleId: number

  @ApiProperty({ description: '起始日期', required: true })
  @IsString()
  startDate: string

  @ApiProperty({ description: '结束日期', required: true })
  @IsString()
  endDate: string
}

export class ArticleTrendItemDto {
  @ApiProperty({ description: '日期' })
  date: string

  @ApiProperty({ description: '浏览次数' })
  viewCount: number
}

export class ArticleTrendResponseDto {
  @ApiProperty({ description: '稿件ID' })
  articleId: number

  @ApiProperty({ description: '稿件标题' })
  title: string

  @ApiProperty({ description: '访问趋势数据' })
  trend: ArticleTrendItemDto[]
}

// ========== 文件下载排行 ==========

export class DownloadRankQueryDto {
  @ApiProperty({ description: '栏目ID筛选', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  columnId?: number

  @ApiProperty({ description: '起始日期', required: false })
  @IsOptional()
  @IsString()
  startDate?: string

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsString()
  endDate?: string

  @ApiProperty({ description: '文件类型筛选（pdf/doc/xls等）', required: false })
  @IsOptional()
  @IsString()
  fileType?: string

  @ApiProperty({ description: '返回条数，默认20，最大50', required: false, default: 20 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number

  @ApiProperty({ description: '排序方式：daily（按当日）/ total（按累计，默认）', required: false, default: 'total' })
  @IsOptional()
  @IsString()
  sortBy?: string
}

export class DownloadRankItemDto {
  @ApiProperty({ description: '排名' })
  rank: number

  @ApiProperty({ description: '附件ID' })
  attachmentId: number

  @ApiProperty({ description: '文件名' })
  fileName: string

  @ApiProperty({ description: '文件类型' })
  fileType: string

  @ApiProperty({ description: '稿件ID' })
  articleId: number

  @ApiProperty({ description: '稿件标题' })
  articleTitle: string

  @ApiProperty({ description: '栏目ID' })
  columnId: number

  @ApiProperty({ description: '栏目名称' })
  columnName: string

  @ApiProperty({ description: '当日下载次数' })
  downloadCount: number

  @ApiProperty({ description: '累计下载次数' })
  totalDownloadCount: number
}

export class DownloadRankResponseDto {
  @ApiProperty({ description: '下载排行列表' })
  list: DownloadRankItemDto[]
}

// ========== 搜索热词统计 ==========

export class HotKeywordsQueryDto {
  @ApiProperty({ description: '统计周期：daily（默认）/ weekly / monthly', required: false, default: 'daily' })
  @IsOptional()
  @IsString()
  period?: string

  @ApiProperty({ description: '返回条数，默认20，最大50', required: false, default: 20 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number
}

export class HotKeywordItemDto {
  @ApiProperty({ description: '排名' })
  rank: number

  @ApiProperty({ description: '关键词' })
  keyword: string

  @ApiProperty({ description: '搜索次数' })
  searchCount: number

  @ApiProperty({ description: '平均结果数量' })
  avgResultCount: number

  @ApiProperty({ description: '趋势：up / down / stable' })
  trend: string
}

export class HotKeywordsResponseDto {
  @ApiProperty({ description: '统计周期' })
  period: string

  @ApiProperty({ description: '生成时间' })
  generatedAt: string

  @ApiProperty({ description: '热词列表' })
  list: HotKeywordItemDto[]
}

// ========== 关键词趋势 ==========

export class KeywordTrendQueryDto {
  @ApiProperty({ description: '关键词', required: true })
  @IsString()
  keyword: string

  @ApiProperty({ description: '起始日期', required: true })
  @IsString()
  startDate: string

  @ApiProperty({ description: '结束日期', required: true })
  @IsString()
  endDate: string
}

export class KeywordTrendItemDto {
  @ApiProperty({ description: '日期' })
  date: string

  @ApiProperty({ description: '搜索次数' })
  searchCount: number
}

export class KeywordTrendResponseDto {
  @ApiProperty({ description: '关键词' })
  keyword: string

  @ApiProperty({ description: '搜索趋势数据' })
  trend: KeywordTrendItemDto[]
}

// ========== 报表导出 ==========

export class ReportExportDto {
  @ApiProperty({ description: '报表类型：column_access / hot_articles / download_rank / hot_keywords / comprehensive', required: true })
  @IsString()
  reportType: string

  @ApiProperty({ description: '导出格式：xlsx（默认）/ pdf', required: false, default: 'xlsx' })
  @IsOptional()
  @IsString()
  format?: string

  @ApiProperty({ description: '筛选条件', required: false })
  @IsOptional()
  filters?: {
    columnId?: number
    startDate?: string
    endDate?: string
  }
}

export class ReportExportResponseDto {
  @ApiProperty({ description: '下载链接' })
  downloadUrl: string

  @ApiProperty({ description: '过期时间' })
  expiresAt: string

  @ApiProperty({ description: '记录数' })
  recordCount: number

  @ApiProperty({ description: '生成时间' })
  generatedAt: string
}

// ========== 推送配置 ==========

export class PushConfigDto {
  @ApiProperty({ description: '报表类型', required: true })
  @IsString()
  reportType: string

  @ApiProperty({ description: '推送周期：daily / weekly / monthly', required: true })
  @IsString()
  pushCycle: string

  @ApiProperty({ description: '周几推送（weekly时有效，1=周一）', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pushDayOfWeek?: number

  @ApiProperty({ description: '每月几号推送（monthly时有效）', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pushDayOfMonth?: number

  @ApiProperty({ description: '推送时间（24小时制）', required: true })
  @IsString()
  pushTime: string

  @ApiProperty({ description: '接收推送的角色列表', required: true })
  @IsArray()
  @IsString({ each: true })
  receiverRoles: string[]

  @ApiProperty({ description: '按部门推送（可选）', required: false })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  receiverDeptIds?: number[]

  @ApiProperty({ description: '是否启用', required: true })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  enabled: boolean
}

// ========== 原始事件上报 ==========

export class RawEventDto {
  @ApiProperty({ description: '事件类型：page_view / file_download / search / article_view', required: true })
  @IsString()
  eventType: string

  @ApiProperty({ description: '用户ID（匿名访客为null）', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number

  @ApiProperty({ description: '会话标识', required: false })
  @IsOptional()
  @IsString()
  sessionId?: string

  @ApiProperty({ description: '客户端IP', required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string

  @ApiProperty({ description: '浏览器UA', required: false })
  @IsOptional()
  @IsString()
  userAgent?: string

  @ApiProperty({ description: '所属栏目ID', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  columnId?: number

  @ApiProperty({ description: '关联稿件ID', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  articleId?: number

  @ApiProperty({ description: '关联附件ID', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  attachmentId?: number

  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  searchKeyword?: string

  @ApiProperty({ description: '来源页面URL', required: false })
  @IsOptional()
  @IsString()
  referer?: string

  @ApiProperty({ description: '设备类型：pc / mobile / tablet', required: false })
  @IsOptional()
  @IsString()
  deviceType?: string

  @ApiProperty({ description: '事件发生时间', required: false })
  @IsOptional()
  @IsString()
  eventTime?: string
}

// ========== 稿件量统计 ==========

export class ArticleCountQueryDto {
  @ApiProperty({ description: '栏目ID筛选', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  columnId?: number

  @ApiProperty({ description: '起始日期', required: true })
  @IsString()
  startDate: string

  @ApiProperty({ description: '结束日期', required: true })
  @IsString()
  endDate: string

  @ApiProperty({ description: '时间粒度：day（默认）/ month', required: false, default: 'day' })
  @IsOptional()
  @IsString()
  granularity?: string

  @ApiProperty({ description: '稿件状态筛选', required: false })
  @IsOptional()
  @IsString()
  status?: string
}

export class ArticleCountDetailDto {
  @ApiProperty({ description: '日期' })
  date: string

  @ApiProperty({ description: '新增稿件数' })
  draftCount: number

  @ApiProperty({ description: '提交审核数' })
  submittedCount: number

  @ApiProperty({ description: '审核通过数' })
  approvedCount: number

  @ApiProperty({ description: '发布数' })
  publishedCount: number

  @ApiProperty({ description: '驳回数' })
  rejectedCount: number
}

export class ArticleCountResponseDto {
  @ApiProperty({ description: '汇总数据' })
  summary: {
    totalDraft: number
    totalSubmitted: number
    totalApproved: number
    totalPublished: number
    totalRejected: number
  }

  @ApiProperty({ description: '详细数据列表' })
  details: ArticleCountDetailDto[]
}

// ========== 审核时长统计 ==========

export class ReviewTimeQueryDto {
  @ApiProperty({ description: '栏目ID筛选', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  columnId?: number

  @ApiProperty({ description: '起始日期', required: true })
  @IsString()
  startDate: string

  @ApiProperty({ description: '结束日期', required: true })
  @IsString()
  endDate: string
}

export class ReviewTimeDetailDto {
  @ApiProperty({ description: '日期' })
  date: string

  @ApiProperty({ description: '平均初审时长（小时）' })
  avgFirstReviewHours: number

  @ApiProperty({ description: '平均终审时长（小时）' })
  avgFinalReviewHours: number

  @ApiProperty({ description: '平均总审核时长（小时）' })
  avgTotalReviewHours: number

  @ApiProperty({ description: '审核完成稿件数' })
  completedCount: number
}

export class ReviewTimeResponseDto {
  @ApiProperty({ description: '汇总数据' })
  summary: {
    avgFirstReviewHours: number
    avgFinalReviewHours: number
    avgTotalReviewHours: number
    p95FirstReviewHours: number
    p95FinalReviewHours: number
  }

  @ApiProperty({ description: '详细数据列表' })
  details: ReviewTimeDetailDto[]
}
