/**
 * 统计分析中心控制器
 * 模块十二：统计分析中心
 */

import { Controller, Get, Post, Body, Query, UseGuards, Inject } from '@nestjs/common'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { StatisticsService } from './statistics.service.js'
// 注意: 不能用 `import type`,否则运行时 DTO 类被擦除,
// ValidationPipe 无法实例化 DTO,@Type(() => Number) 装饰器不生效,
// 导致 columnId 等 number 字段以 string 传入 Prisma 报错
import {
  ColumnAccessQueryDto,
  HotArticlesQueryDto,
  ArticleTrendQueryDto,
  DownloadRankQueryDto,
  HotKeywordsQueryDto,
  KeywordTrendQueryDto,
  ArticleCountQueryDto,
  ReviewTimeQueryDto,
  RawEventDto,
  ReportExportDto,
  PushConfigDto,
} from './dto/statistics.dto.js'

@Controller('stats')
export class StatisticsController {
  constructor(@Inject(StatisticsService) private statisticsService: StatisticsService) {}

  // ========== 原始事件上报（公开接口） ==========

  /**
   * 上报原始事件（前端埋点）
   */
  @Post('beacon')
  async reportEvent(@Body() dto: RawEventDto) {
    await this.statisticsService.reportRawEvent(dto)
    return ApiResponseHelper.success(null, '上报成功')
  }

  /**
   * 批量上报原始事件
   */
  @Post('beacon/batch')
  async reportEvents(@Body() dtos: RawEventDto[]) {
    await this.statisticsService.reportRawEvents(dtos)
    return ApiResponseHelper.success(null, '批量上报成功')
  }

  // ========== 栏目访问量统计 ==========

  /**
   * 获取全栏目访问统计(一次返回所有栏目 PV/UV, 避免前端 N+1 查询)
   * 注意: 必须放在 column-access 路由之前, 否则 'all' 会被当作参数匹配
   */
  @Get('column-access/all')
  @UseGuards(AuthGuard)
  async getAllColumnAccess(@Query() dto: ColumnAccessQueryDto) {
    const result = await this.statisticsService.getAllColumnAccess(dto)
    return ApiResponseHelper.success(result)
  }

  /**
   * 获取栏目访问量统计(单栏目或全站汇总)
   */
  @Get('column-access')
  @UseGuards(AuthGuard)
  async getColumnAccess(@Query() dto: ColumnAccessQueryDto) {
    const result = await this.statisticsService.getColumnAccess(dto)
    return ApiResponseHelper.success(result)
  }

  // ========== 热门内容统计 ==========

  /**
   * 获取热门文章榜单
   */
  @Get('hot-articles')
  @UseGuards(AuthGuard)
  async getHotArticles(@Query() dto: HotArticlesQueryDto) {
    const result = await this.statisticsService.getHotArticles(dto)
    return ApiResponseHelper.success(result)
  }

  /**
   * 获取稿件访问趋势
   */
  @Get('article-trend')
  @UseGuards(AuthGuard)
  async getArticleTrend(@Query() dto: ArticleTrendQueryDto) {
    const result = await this.statisticsService.getArticleTrend(dto)
    return ApiResponseHelper.success(result)
  }

  // ========== 文件下载排行统计 ==========

  /**
   * 获取文件下载排行
   */
  @Get('download-rank')
  @UseGuards(AuthGuard)
  async getDownloadRank(@Query() dto: DownloadRankQueryDto) {
    const result = await this.statisticsService.getDownloadRank(dto)
    return ApiResponseHelper.success(result)
  }

  // ========== 搜索热词统计 ==========

  /**
   * 获取搜索热词榜单
   */
  @Get('hot-keywords')
  @UseGuards(AuthGuard)
  async getHotKeywords(@Query() dto: HotKeywordsQueryDto) {
    const result = await this.statisticsService.getHotKeywords(dto)
    return ApiResponseHelper.success(result)
  }

  /**
   * 获取关键词搜索趋势
   */
  @Get('keyword-trend')
  @UseGuards(AuthGuard)
  async getKeywordTrend(@Query() dto: KeywordTrendQueryDto) {
    const result = await this.statisticsService.getKeywordTrend(dto)
    return ApiResponseHelper.success(result)
  }

  // ========== 稿件量统计 ==========

  /**
   * 获取稿件量统计
   */
  @Get('article-count')
  @UseGuards(AuthGuard)
  async getArticleCount(@Query() dto: ArticleCountQueryDto) {
    const result = await this.statisticsService.getArticleCount(dto)
    return ApiResponseHelper.success(result)
  }

  // ========== 审核时长统计 ==========

  /**
   * 获取审核时长统计
   */
  @Get('review-time')
  @UseGuards(AuthGuard)
  async getReviewTime(@Query() dto: ReviewTimeQueryDto) {
    const result = await this.statisticsService.getReviewTime(dto)
    return ApiResponseHelper.success(result)
  }

  // ========== 报表导出 ==========

  /**
   * 导出统计报表
   */
  @Post('export')
  @UseGuards(AuthGuard)
  async exportReport(@Body() dto: ReportExportDto) {
    // 模拟导出，实际实现需要集成 Excel/PDF 生成库
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '')
    const fileName = `${dto.reportType}_${timestamp}.${dto.format || 'xlsx'}`

    return ApiResponseHelper.success({
      downloadUrl: `/api/v1/stats/export/${fileName}`,
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      recordCount: 100,
      generatedAt: now.toISOString(),
    })
  }

  // ========== 诊断端点（仅开发环境使用） ==========

  /**
   * 诊断：检查统计数据状态
   * 返回 StatRawEvent 和 StatColumnAccess 的记录数
   */
  @Get('diagnose')
  async diagnose() {
    const result = await this.statisticsService.diagnose()
    return ApiResponseHelper.success(result)
  }

  /**
   * 手动触发聚合任务（用于测试，无需等待 cron）
   */
  @Post('aggregate-now')
  async triggerAggregate() {
    await this.statisticsService.aggregateColumnAccess()
    return ApiResponseHelper.success({ message: '聚合任务已触发' })
  }

  // ========== 推送配置 ==========

  /**
   * 配置统计报表定时推送
   */
  @Post('push-config')
  @UseGuards(AuthGuard)
  async setPushConfig(@Body() dto: PushConfigDto) {
    // 模拟推送配置，实际实现需要持久化到数据库并配置定时任务
    return ApiResponseHelper.success(dto, '推送配置已保存')
  }
}
