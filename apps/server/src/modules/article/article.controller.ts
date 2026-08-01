import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, ParseIntPipe, Inject } from '@nestjs/common'
import { ArticleService } from './article.service.js'
import { ArticleExpiryService } from '../schedule/article-expiry.service.js'
import { ArticleStatus } from './article.constants.js'
import { CreateDraftDto, UpdateDraftDto } from './dto/create-draft.dto.js'
import { SubmitDraftDto } from './dto/submit-draft.dto.js'
import { FirstReviewDto } from './dto/first-review.dto.js'
import { FinalReviewDto } from './dto/final-review.dto.js'
import { WithdrawDto } from './dto/withdraw.dto.js'
import { PinArticleDto } from './dto/pin-article.dto.js'
import { ResubmitDto } from './dto/resubmit.dto.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'

@Controller('article')
@UseGuards(AuthGuard)
export class ArticleController {
  private articleService: ArticleService
  private articleExpiryService: ArticleExpiryService

  constructor(
    @Inject(ArticleService) articleService: ArticleService,
    @Inject(ArticleExpiryService) articleExpiryService: ArticleExpiryService,
  ) {
    this.articleService = articleService
    this.articleExpiryService = articleExpiryService
  }

  // ==================== 通用列表 (通过 ?status=xxx 分发) ====================

  @Get()
  async listByStatus(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('columnId') columnId?: string,
    @Query('type') type?: string,
    @CurrentUser() user: any = {},
  ) {
    const p = page ? Number(page) : 1
    const ps = pageSize ? Number(pageSize) : 10
    const q = { page: p, pageSize: ps, keyword, columnId: columnId ? Number(columnId) : undefined, type }

    // 系统管理员查询全站稿件（只读，含栏目名称和作者信息）
    if (user.role === 'system_admin') {
      const r = await this.articleService.findAllForSystemAdmin({ ...q, status })
      return ApiResponseHelper.paginated(r.list, r.total, r.page, r.pageSize)
    }

    switch (status) {
      case ArticleStatus.DRAFT: {
        const r = await this.articleService.findMyDrafts(user.id, user.role, user.bindColumnIds, q)
        return ApiResponseHelper.paginated(r.list, r.total, r.page, r.pageSize)
      }
      case ArticleStatus.PENDING_REVIEW: {
        const r = await this.articleService.findPendingReview(user.id, user.role, user.bindColumnIds, q)
        return ApiResponseHelper.paginated(r.list, r.total, r.page, r.pageSize)
      }
      case ArticleStatus.FINAL_PENDING: {
        const r = await this.articleService.findPendingFinalReview(user.role, user.bindColumnIds, q)
        return ApiResponseHelper.paginated(r.list, r.total, r.page, r.pageSize)
      }
      case ArticleStatus.PUBLISHED: {
        const r = await this.articleService.findPublished(user.role, user.bindColumnIds, q)
        return ApiResponseHelper.paginated(r.list, r.total, r.page, r.pageSize)
      }
      case 'rejected':
      case ArticleStatus.REVIEW_REJECTED: {
        const r = await this.articleService.findRejected(user.id, user.role, user.bindColumnIds, q)
        return ApiResponseHelper.paginated(r.list, r.total, r.page, r.pageSize)
      }
      default: {
        // 无 status → 返回当前用户可见的全部稿件 (按时间排序)
        const r = await this.articleService.findMyDrafts(user.id, user.role, user.bindColumnIds, q)
        return ApiResponseHelper.paginated(r.list, r.total, r.page, r.pageSize)
      }
    }
  }

  // ==================== 草稿管理 ====================

  @Post()
  async createDraft(
    @Body() dto: CreateDraftDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.articleService.createDraft(
      user.id,
      user.role,
      user.bindColumnIds,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '草稿创建成功')
  }

  @Get('draft')
  async listMyDrafts(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.articleService.findMyDrafts(
      user.id,
      user.role,
      user.bindColumnIds,
      {
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 10,
        keyword,
      },
    )
    return ApiResponseHelper.paginated(result.list, result.total, result.page, result.pageSize)
  }

  @Get('pending')
  async listPendingReview(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.articleService.findPendingReview(
      user.id,
      user.role,
      user.bindColumnIds,
      {
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 10,
        keyword,
      },
    )
    return ApiResponseHelper.paginated(result.list, result.total, result.page, result.pageSize)
  }

  @Get('final-pending')
  async listPendingFinalReview(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.articleService.findPendingFinalReview(
      user.role,
      user.bindColumnIds,
      {
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 10,
        keyword,
      },
    )
    return ApiResponseHelper.paginated(result.list, result.total, result.page, result.pageSize)
  }

  @Get('published')
  async listPublished(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('columnId') columnId?: string,
  ) {
    const result = await this.articleService.findPublished(
      user.role,
      user.bindColumnIds,
      {
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 10,
        keyword,
        columnId: columnId ? Number(columnId) : undefined,
      },
    )
    return ApiResponseHelper.paginated(result.list, result.total, result.page, result.pageSize)
  }

  @Get('rejected')
  async listRejected(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.articleService.findRejected(
      user.id,
      user.role,
      user.bindColumnIds,
      {
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 10,
        keyword,
      },
    )
    return ApiResponseHelper.paginated(result.list, result.total, result.page, result.pageSize)
  }

  @Get('archived')
  async listArchived(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('columnId') columnId?: string,
    @Query('timeLabel') timeLabel?: string,
    @Query('archiveType') archiveType?: string,
  ) {
    const result = await this.articleService.findArchivedArticles(
      user.role,
      user.bindColumnIds,
      {
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 10,
        keyword,
        columnId: columnId ? Number(columnId) : undefined,
        timeLabel,
        archiveType,
      },
    )
    return ApiResponseHelper.paginated(result.list, result.total, result.page, result.pageSize)
  }

  @Get('archive-logs')
  async listArchiveLogs(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('columnId') columnId?: string,
    @Query('archiveType') archiveType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.articleService.findArchiveLogs(
      user.role,
      user.bindColumnIds,
      {
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 10,
        columnId: columnId ? Number(columnId) : undefined,
        archiveType,
        startDate,
        endDate,
      },
    )
    return ApiResponseHelper.paginated(result.list, result.total, result.page, result.pageSize)
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    const result = await this.articleService.findById(id, user.id, user.role, user.bindColumnIds)
    return ApiResponseHelper.success(result)
  }

  @Get(':id/attachments')
  async getAttachments(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.articleService.findArticleAttachments(
      id,
      user.role,
      user.bindColumnIds,
    )
    return ApiResponseHelper.success(result)
  }

  @Put(':id')
  async updateDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDraftDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.articleService.updateDraft(id, user.id, user.role, dto, req.ip)
    return ApiResponseHelper.success(result, '草稿更新成功')
  }

  @Delete(':id')
  async deleteDraft(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    await this.articleService.deleteDraft(id, user.id, user.role, req.ip)
    return ApiResponseHelper.success(null, '草稿删除成功')
  }

  // ==================== 提交审核 ====================

  @Post(':id/submit')
  async submitForReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitDraftDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.articleService.submitForReview(id, user.id, user.role, dto, req.ip)
    return ApiResponseHelper.success(result, '已提交审核')
  }

  // ==================== 初审 ====================

  @Post(':id/review')
  async firstReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FirstReviewDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.articleService.firstReview(id, user.id, user.role, dto, req.ip)
    return ApiResponseHelper.success(result, '初审完成')
  }

  // ==================== 终审 ====================

  @Post(':id/final-review')
  async finalReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FinalReviewDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.articleService.finalReview(id, user.id, user.role, dto, req.ip)
    return ApiResponseHelper.success(result, '终审完成')
  }

  // ==================== 重新提交 ====================

  @Post(':id/resubmit')
  async resubmit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResubmitDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.articleService.resubmit(id, user.id, user.role, dto, req.ip)
    return ApiResponseHelper.success(result, '已重新提交审核')
  }

  // ==================== 撤回 ====================

  @Post(':id/withdraw')
  async withdraw(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: WithdrawDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.articleService.withdraw(id, user.id, user.role, dto, req.ip, user.bindColumnIds)
    return ApiResponseHelper.success(result, '已撤回')
  }

  // ==================== 置顶 ====================

  @Post(':id/top')
  async pinArticle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PinArticleDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.articleService.pinArticle(id, user.id, user.role, dto, req.ip)
    return ApiResponseHelper.success(result, '置顶成功')
  }

  @Post(':id/unpin')
  async unpinArticle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.articleService.unpinArticle(id, user.id, user.role, req.ip)
    return ApiResponseHelper.success(result, '取消置顶成功')
  }

  // ==================== 归档管理（模块十九） ====================

  @Post(':id/archive')
  async archiveArticle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.articleService.archiveArticle(
      id,
      user.id,
      user.role,
      user.nickname || user.username || '管理员',
      req.ip,
    )
    return ApiResponseHelper.success(result, '归档成功')
  }

  @Post(':id/restore')
  async restoreArchived(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.articleService.restoreArchivedArticle(
      id,
      user.id,
      user.role,
      req.ip,
    )
    return ApiResponseHelper.success(result, '恢复成功')
  }

  @Post('semester-archive')
  async triggerSemesterArchive(
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.articleExpiryService.triggerSemesterArchive(
      user.id,
      user.role,
    )
    return ApiResponseHelper.success(result, `学期批量归档完成，共归档 ${result.archivedCount} 篇`)
  }
}