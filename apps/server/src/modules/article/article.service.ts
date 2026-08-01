import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import { SensitiveWordService } from '../sensitive-word/sensitive-word.service.js'
import { MessageService } from '../message/message.service.js'
import { ColumnService } from '../column/column.service.js'
import { FileResourceService } from '../file-resource/file-resource.service.js'
import { ArticleIndexService } from '../search/article-index.service.js'
import { RiskControlSourceType, FilterResultType } from '../sensitive-word/sensitive-word.constants.js'
import { ColumnStatus } from '../column/column.constants.js'
import {
  ArticleStatus,
  ArticleType,
  SecretLevel,
  PinLevel,
  ArchiveType,
  TimeLabel,
} from './article.constants.js'
import type { CreateDraftDto, UpdateDraftDto } from './dto/create-draft.dto.js'
import type { SubmitDraftDto } from './dto/submit-draft.dto.js'
import type { FirstReviewDto } from './dto/first-review.dto.js'
import type { FinalReviewDto } from './dto/final-review.dto.js'
import type { WithdrawDto } from './dto/withdraw.dto.js'
import type { PinArticleDto } from './dto/pin-article.dto.js'
import type { ResubmitDto } from './dto/resubmit.dto.js'

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name)

  private prisma: PrismaService
  private auditLog: AuditLogService
  private sensitiveWordService: SensitiveWordService
  private messageService: MessageService
  private columnService: ColumnService
  private fileResourceService: FileResourceService
  private articleIndexService: ArticleIndexService

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(AuditLogService) auditLog: AuditLogService,
    @Inject(SensitiveWordService) sensitiveWordService: SensitiveWordService,
    @Inject(MessageService) messageService: MessageService,
    @Inject(ColumnService) columnService: ColumnService,
    @Inject(FileResourceService) fileResourceService: FileResourceService,
    @Inject(ArticleIndexService) articleIndexService: ArticleIndexService,
  ) {
    this.prisma = prisma
    this.auditLog = auditLog
    this.sensitiveWordService = sensitiveWordService
    this.messageService = messageService
    this.columnService = columnService
    this.fileResourceService = fileResourceService
    this.articleIndexService = articleIndexService
  }

  /**
   * 根据标题生成唯一 articleSlug
   * 格式: {slug}-{随机6位}
   */
  private generateArticleSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48)
    const random = Math.random().toString(36).slice(2, 8)
    return `${base || 'article'}-${random}`
  }

  /**
   * 规范化标签 JSON 字符串
   * 确保存储的是合法的 JSON 数组字符串
   */
  private normalizeTags(tags?: string): string {
    if (!tags) return '[]'
    try {
      const parsed = JSON.parse(tags)
      return Array.isArray(parsed) ? JSON.stringify(parsed) : '[]'
    } catch {
      return '[]'
    }
  }

  /**
   * 从 timeTags JSON 数组中提取时效标签编码
   * 映射: '长期有效' → LONG_TERM, '学期周期' → SEMESTER, '即时办理' → INSTANT
   */
  private extractTimeLabel(timeTags?: string): string | null {
    if (!timeTags) return null
    try {
      const parsed = JSON.parse(timeTags)
      if (!Array.isArray(parsed) || parsed.length === 0) return null
      const labelMap: Record<string, string> = {
        '长期有效': 'LONG_TERM',
        '学期周期': 'SEMESTER',
        '即时办理': 'INSTANT',
        'LONG_TERM': 'LONG_TERM',
        'SEMESTER': 'SEMESTER',
        'INSTANT': 'INSTANT',
      }
      for (const tag of parsed) {
        const code = labelMap[String(tag)]
        if (code) return code
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * 解析前端传入的 images 和 attachments JSON 字符串，生成 Attachment 创建数据
   * - images: 字符串数组 (URL 列表)，fileType 标记为 'image'
   * - attachments: 字符串数组或对象数组 ({url, name, size?, type?})，fileType 标记为 'file'
   */
  private parseAttachmentInputs(images?: string, attachments?: string): any[] {
    const result: any[] = []

    // 解析图片 URL 数组
    if (images) {
      try {
        const urls = JSON.parse(images)
        if (Array.isArray(urls)) {
          for (const url of urls) {
            if (typeof url === 'string' && url) {
              result.push({
                name: url.split('/').pop() || 'image',
                fileUrl: url,
                fileSize: 0,
                fileType: 'image',
              })
            }
          }
        }
      } catch {
        this.logger.warn(`解析 images 字段失败: ${images}`)
      }
    }

    // 解析附件数组（可能是字符串 URL 或对象）
    if (attachments) {
      try {
        const list = JSON.parse(attachments)
        if (Array.isArray(list)) {
          for (const item of list) {
            if (typeof item === 'string' && item) {
              result.push({
                name: item.split('/').pop() || 'file',
                fileUrl: item,
                fileSize: 0,
                fileType: 'file',
              })
            } else if (item && typeof item === 'object' && item.url) {
              result.push({
                name: item.name || item.url.split('/').pop() || 'file',
                fileUrl: item.url,
                fileSize: item.size || 0,
                fileType: item.type || 'file',
              })
            }
          }
        }
      } catch {
        this.logger.warn(`解析 attachments 字段失败: ${attachments}`)
      }
    }

    return result
  }

  // ==================== 草稿管理 ====================

  /**
   * 创建草稿
   * 编辑只能在自己的栏目权限范围内创建草稿
   */
  async createDraft(
    authorId: number,
    authorRole: string,
    bindColumnIds: number[],
    dto: CreateDraftDto,
    ip?: string,
  ) {
    // 栏目权限校验 (子栏目自动继承父栏目权限)
    if (authorRole !== 'system_admin') {
      const allowed = await this.columnService.isColumnInAllowedSet(dto.columnId, bindColumnIds)
      if (!allowed) {
        throw new ForbiddenException(`无权在此栏目创建稿件 (columnId=${dto.columnId})`)
      }
    }

    // 栏目存在性及状态校验（通过 ColumnService）
    const column = await this.columnService.findById(dto.columnId)
    if (column.status !== ColumnStatus.ACTIVE) {
      throw new BadRequestException(`栏目 "${column.columnName}" 当前不可用 (status=${column.status})`)
    }

    const attachmentCreates = this.parseAttachmentInputs(dto.images, dto.attachments)

    // 从 timeTags 中提取时效标签编码（LONG_TERM/SEMESTER/INSTANT）
    const timeLabel = this.extractTimeLabel(dto.timeTags)

    const article = await this.prisma.article.create({
      data: {
        columnId: dto.columnId,
        articleSlug: this.generateArticleSlug(dto.title),
        title: dto.title,
        content: dto.content ?? null,
        encryptedContent: dto.encryptedContent ?? null,
        summary: dto.summary ?? null,
        authorId,
        type: dto.type ?? ArticleType.NORMAL,
        secretLevel: dto.secretLevel ?? SecretLevel.NORMAL,
        status: ArticleStatus.DRAFT,
        businessTags: this.normalizeTags(dto.businessTags),
        roleTags: this.normalizeTags(dto.roleTags),
        timeTags: this.normalizeTags(dto.timeTags),
        timeLabel,
        expireDate: dto.expireDate ? new Date(dto.expireDate) : null,
        attachments: attachmentCreates.length > 0 ? { create: attachmentCreates } : undefined,
      },
      include: { attachments: true },
    })

    await this.auditLog.create({
      adminId: authorId,
      role: authorRole,
      action: 'article_create_draft',
      targetType: 'article',
      targetId: article.id,
      ip,
      detail: JSON.stringify({ title: dto.title }),
    })

    return article
  }

  /**
   * 修改草稿
   * 只有草稿的作者才能修改
   */
  async updateDraft(
    articleId: number,
    userId: number,
    userRole: string,
    dto: UpdateDraftDto,
    ip?: string,
  ) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } })
    if (!article) throw new NotFoundException('稿件不存在')
    // 允许修改草稿和被驳回的稿件, 已发布/审核中等状态不允许修改
    const allowedStatuses = [ArticleStatus.DRAFT, ArticleStatus.REVIEW_REJECTED]
    if (!allowedStatuses.includes(article.status as any)) {
      throw new BadRequestException(`只能修改草稿或被驳回的稿件，当前状态: ${article.status}`)
    }
    if (article.authorId !== userId && userRole !== 'system_admin') {
      throw new ForbiddenException('只能修改自己创建的草稿')
    }

    // 栏目权限校验
    if (userRole !== 'system_admin' && !(await this.canAccessColumn(userRole, userId, dto.columnId))) {
      throw new ForbiddenException('无权在此栏目操作')
    }

    // 栏目存在性及状态校验（通过 ColumnService）
    const column = await this.columnService.findById(dto.columnId)
    if (column.status !== ColumnStatus.ACTIVE) {
      throw new BadRequestException(`栏目 "${column.columnName}" 当前不可用 (status=${column.status})`)
    }

    const attachmentCreates = this.parseAttachmentInputs(dto.images, dto.attachments)

    // 从 timeTags 中提取时效标签编码
    const timeLabel = dto.timeTags !== undefined ? this.extractTimeLabel(dto.timeTags) : undefined

    const updated = await this.prisma.article.update({
      where: { id: articleId },
      data: {
        status: article.status === ArticleStatus.REVIEW_REJECTED ? ArticleStatus.DRAFT : undefined,
        reviewComment: article.status === ArticleStatus.REVIEW_REJECTED ? null : undefined,
        reviewerId: article.status === ArticleStatus.REVIEW_REJECTED ? null : undefined,
        reviewedAt: article.status === ArticleStatus.REVIEW_REJECTED ? null : undefined,
        rejectCount: article.status === ArticleStatus.REVIEW_REJECTED ? 0 : undefined,
        columnId: dto.columnId,
        title: dto.title,
        content: dto.content ?? null,
        encryptedContent: dto.encryptedContent ?? null,
        summary: dto.summary ?? null,
        type: dto.type ?? article.type,
        secretLevel: dto.secretLevel ?? article.secretLevel,
        // 标签：未传则不更新（undefined），传了则规范化存储
        businessTags: dto.businessTags !== undefined ? this.normalizeTags(dto.businessTags) : undefined,
        roleTags: dto.roleTags !== undefined ? this.normalizeTags(dto.roleTags) : undefined,
        timeTags: dto.timeTags !== undefined ? this.normalizeTags(dto.timeTags) : undefined,
        // 时效标签：跟随 timeTags 更新
        timeLabel: timeLabel !== undefined ? timeLabel : undefined,
        expireDate: dto.expireDate !== undefined ? (dto.expireDate ? new Date(dto.expireDate) : null) : undefined,
        // 附件：仅在传入 images 或 attachments 时才删除并重建
        attachments: (dto.images !== undefined || dto.attachments !== undefined)
          ? { deleteMany: {}, create: attachmentCreates }
          : undefined,
      },
      include: { attachments: true },
    })

    await this.auditLog.create({
      adminId: userId,
      role: userRole,
      action: 'article_update_draft',
      targetType: 'article',
      targetId: articleId,
      ip,
    })

    return updated
  }

  /**
   * 删除草稿
   * 只有草稿的作者或系统管理员才能删除
   */
  async deleteDraft(articleId: number, userId: number, userRole: string, ip?: string) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } })
    if (!article) throw new NotFoundException('稿件不存在')
    if (article.status !== ArticleStatus.DRAFT) {
      throw new BadRequestException('只能删除草稿状态的稿件')
    }
    if (article.authorId !== userId && userRole !== 'system_admin') {
      throw new ForbiddenException('只能删除自己创建的草稿')
    }

    await this.prisma.article.delete({ where: { id: articleId } })
    this.articleIndexService.removeArticle(articleId).catch((err: any) => {
      this.logger.error(`移除搜索索引失败 articleId=${articleId}: ${err?.message ?? err}`)
    })

    await this.auditLog.create({
      adminId: userId,
      role: userRole,
      action: 'article_delete_draft',
      targetType: 'article',
      targetId: articleId,
      ip,
    })

    return { success: true }
  }

  // ==================== 提交审核 ====================

  /**
   * 提交审核
   * 草稿 → 待初审
   */
  async submitForReview(
    articleId: number,
    userId: number,
    userRole: string,
    dto: SubmitDraftDto,
    ip?: string,
  ) {
    // 系统管理员不参与内容运营, 无提交送审权(发布流程入口)
    if (userRole === 'system_admin') {
      throw new ForbiddenException('系统管理员无提交送审权限, 请使用编辑员账号')
    }
    const article = await this.prisma.article.findUnique({ where: { id: articleId } })
    if (!article) throw new NotFoundException('稿件不存在')
    const allowedStatuses = [ArticleStatus.DRAFT, ArticleStatus.REVIEW_REJECTED]
    if (!allowedStatuses.includes(article.status as any)) {
      throw new BadRequestException(`当前状态 ${article.status} 不允许提交审核`)
    }
    if (article.authorId !== userId) {
      throw new ForbiddenException('只能提交自己的稿件')
    }

    // 涉密公文需提供加密内容
    if (article.type === ArticleType.CONFIDENTIAL && !article.encryptedContent && !dto.reviewComment) {
      // 已有 encryptedContent 则无需额外校验
    }

    // ========== 敏感词过滤(核心逻辑) ==========
    // 使用filterArticleContent方法处理涉密公文的RSA解密和敏感词检测
    const filterResult = await this.sensitiveWordService.filterArticleContent(
      article.content,
      article.encryptedContent,
      article.secretLevel,
      RiskControlSourceType.ADMIN_SUBMIT,
      userId,
      ip,
      articleId,
    )

    // 3. 分级处置
    if (filterResult.type === FilterResultType.BLOCKED) {
      // 高危敏感词:直接拦截
      const matchedWords = filterResult.matchedWords.map(w => w.word).join(', ')
      throw new BadRequestException(`稿件包含高危敏感词,禁止提交: ${matchedWords}`)
    }

    // 4. 确定最终内容(脱敏或原文)
    const finalContent = filterResult.type === FilterResultType.DESENSITIZED
      ? filterResult.desensitizedText
      : (filterResult.type === FilterResultType.PASS && filterResult.desensitizedText
        ? filterResult.desensitizedText
        : article.content)

    // 5. 更新稿件状态
    const submittedAt = new Date()
    const updated = await this.prisma.article.update({
      where: { id: articleId },
      data: {
        status: ArticleStatus.PENDING_REVIEW,
        content: finalContent, // 使用过滤后的内容
        submittedAt,
        reviewerId: null,
        reviewComment: null,
        reviewedAt: null,
        finalReviewerId: null,
        finalReviewComment: null,
        finalReviewedAt: null,
      },
    })

    // V2.0: 通过 MessageService 发送业务待办通知
    const submitter = await this.prisma.admin.findUnique({ where: { id: userId } })
    await this.messageService.sendManuscriptSubmitted(
      article.id,
      article.title,
      userId,
      submitter?.nickname ?? submitter?.username ?? '用户',
    )

    await this.auditLog.create({
      adminId: userId,
      role: userRole,
      action: 'article_submit_review',
      targetType: 'article',
      targetId: articleId,
      ip,
      detail: JSON.stringify({
        filterAction: filterResult.type,
        matchedWordsCount: filterResult.matchedWords.length,
      }),
    })

    return updated
  }

  // ==================== 初审 ====================

  /**
   * 初审
   * 审核人员对稿件进行初审
   * - 普通稿件: 通过 → published
   * - 涉密公文: 通过 → final_pending
   * - 驳回 → review_rejected
   */
  async firstReview(
    articleId: number,
    reviewerId: number,
    reviewerRole: string,
    dto: FirstReviewDto,
    ip?: string,
  ) {
    // 系统管理员不参与内容运营, 无审核/发布权
    if (reviewerRole === 'system_admin') {
      throw new ForbiddenException('系统管理员无审核权限, 请使用审核员/栏目管理员账号')
    }
    const article = await this.prisma.article.findUnique({ where: { id: articleId } })
    if (!article) throw new NotFoundException('稿件不存在')
    if (article.status !== ArticleStatus.PENDING_REVIEW) {
      throw new BadRequestException(`当前状态 ${article.status} 不允许初审`)
    }

    // 权限校验: 审核人员必须有对应栏目权限或为系统管理员
    if (reviewerRole !== 'system_admin') {
      // 简化: 只要有 article.review 权限即可（在守卫中已校验）
    }

    const now = new Date()

    if (dto.action === ArticleStatus.REVIEW_REJECTED) {
      // 驳回
      const updated = await this.prisma.article.update({
        where: { id: articleId },
        data: {
          status: ArticleStatus.REVIEW_REJECTED,
          reviewerId,
          reviewComment: dto.reviewComment ?? '初审驳回',
          reviewedAt: now,
          rejectCount: { increment: 1 },
        },
      })

      // V2.0: 通知作者驳回
      const rejector = await this.prisma.admin.findUnique({ where: { id: reviewerId } })
      await this.messageService.sendManuscriptReviewRejected(
        article.id,
        article.title,
        article.authorId,
        dto.reviewComment ?? '初审驳回',
        reviewerId,
      )

      await this.auditLog.create({
        adminId: reviewerId,
        role: reviewerRole,
        action: 'article_first_review_reject',
        targetType: 'article',
        targetId: articleId,
        ip,
        detail: JSON.stringify({ comment: dto.reviewComment }),
      })

      return updated
    }

    if (dto.action === ArticleStatus.PUBLISHED) {
      // 普通稿件: 直接发布
      if (article.type === ArticleType.CONFIDENTIAL) {
        throw new BadRequestException('涉密公文必须经过终审才能发布')
      }

      const updated = await this.prisma.article.update({
        where: { id: articleId },
        data: {
          status: ArticleStatus.PUBLISHED,
          reviewerId,
          reviewComment: dto.reviewComment ?? '',
          reviewedAt: now,
          publishedAt: now,
        },
      })

      // V2.0: 通知作者稿件已发布
      const publisher = await this.prisma.admin.findUnique({ where: { id: reviewerId } })
      await this.messageService.sendManuscriptPublished(
        article.id,
        article.title,
        article.authorId,
        reviewerId,
      )

      await this.auditLog.create({
        adminId: reviewerId,
        role: reviewerRole,
        action: 'article_first_review_publish',
        targetType: 'article',
        targetId: articleId,
        ip,
      })

      this.articleIndexService.syncArticle(articleId).catch((err: any) => {
        this.logger.error(`同步搜索索引失败 articleId=${articleId}: ${err?.message ?? err}`)
      })

      return updated
    }

    if (dto.action === ArticleStatus.FINAL_PENDING) {
      // 涉密公文: 转终审
      if (article.type !== ArticleType.CONFIDENTIAL) {
        throw new BadRequestException('仅涉密公文需要终审')
      }

      const updated = await this.prisma.article.update({
        where: { id: articleId },
        data: {
          status: ArticleStatus.FINAL_PENDING,
          reviewerId,
          reviewComment: dto.reviewComment ?? '初审通过，转终审',
          reviewedAt: now,
        },
      })

      // V2.0: 通知终审人员
      const reviewer = await this.prisma.admin.findUnique({ where: { id: reviewerId } })
      await this.messageService.sendManuscriptReviewPassToFinal(
        article.id,
        article.title,
        reviewerId,
        reviewer?.nickname ?? reviewer?.username ?? '审核员',
      )

      await this.auditLog.create({
        adminId: reviewerId,
        role: reviewerRole,
        action: 'article_first_review_to_final',
        targetType: 'article',
        targetId: articleId,
        ip,
      })

      return updated
    }

    throw new BadRequestException('无效的初审操作')
  }

  // ==================== 终审 ====================

  /**
   * 终审
   * 仅针对涉密公文的二次审批
   * - 通过 → published
   * - 驳回 → review_rejected
   */
  async finalReview(
    articleId: number,
    finalReviewerId: number,
    finalReviewerRole: string,
    dto: FinalReviewDto,
    ip?: string,
  ) {
    // 系统管理员不参与内容运营, 无终审/发布权
    if (finalReviewerRole === 'system_admin') {
      throw new ForbiddenException('系统管理员无终审权限, 请使用审核员/栏目管理员账号')
    }
    const article = await this.prisma.article.findUnique({ where: { id: articleId } })
    if (!article) throw new NotFoundException('稿件不存在')
    if (article.status !== ArticleStatus.FINAL_PENDING) {
      throw new BadRequestException(`当前状态 ${article.status} 不允许终审`)
    }
    if (article.type !== ArticleType.CONFIDENTIAL) {
      throw new BadRequestException('仅涉密公文需要终审')
    }

    const now = new Date()

    if (dto.action === ArticleStatus.PUBLISHED) {
      // 终审通过 → 发布或定时发布
      const hasScheduledPublish = dto.scheduledPublishAt && new Date(dto.scheduledPublishAt) > now
      
      let updated: any
      
      if (hasScheduledPublish) {
        // 设置定时发布
        updated = await this.prisma.article.update({
          where: { id: articleId },
          data: {
            status: ArticleStatus.FINAL_PENDING,
            finalReviewerId,
            finalReviewComment: dto.finalReviewComment ?? '',
            finalReviewedAt: now,
            scheduledPublishAt: new Date(dto.scheduledPublishAt!),
          },
        })

        await this.auditLog.create({
          adminId: finalReviewerId,
          role: finalReviewerRole,
          action: 'article_final_review_scheduled',
          targetType: 'article',
          targetId: articleId,
          ip,
          detail: JSON.stringify({
            scheduledPublishAt: dto.scheduledPublishAt,
          }),
        })

        return updated
      } else {
        // 立即发布
        updated = await this.prisma.article.update({
          where: { id: articleId },
          data: {
            status: ArticleStatus.PUBLISHED,
            finalReviewerId,
            finalReviewComment: dto.finalReviewComment ?? '',
            finalReviewedAt: now,
            publishedAt: now,
          },
        })

        // V2.0: 终审通过 → 通知作者
        const finalReviewer = await this.prisma.admin.findUnique({ where: { id: finalReviewerId } })
        await this.messageService.sendManuscriptFinalPublished(
          article.id,
          article.title,
          article.authorId,
          finalReviewerId,
        )

        await this.auditLog.create({
          adminId: finalReviewerId,
          role: finalReviewerRole,
          action: 'article_final_review_publish',
          targetType: 'article',
          targetId: articleId,
          ip,
        })

      this.articleIndexService.syncArticle(articleId).catch((err: any) => {
        this.logger.error(`同步搜索索引失败 articleId=${articleId}: ${err?.message ?? err}`)
      })

      return updated
    }
    }

    if (dto.action === ArticleStatus.REVIEW_REJECTED) {
      // 终审驳回
      const updated = await this.prisma.article.update({
        where: { id: articleId },
        data: {
          status: ArticleStatus.REVIEW_REJECTED,
          finalReviewerId,
          finalReviewComment: dto.finalReviewComment ?? '终审驳回',
          finalReviewedAt: now,
          rejectCount: { increment: 1 },
        },
      })

      // V2.0: 终审驳回 → 通知作者
      await this.messageService.sendManuscriptFinalRejected(
        article.id,
        article.title,
        article.authorId,
        dto.finalReviewComment ?? '终审驳回',
        finalReviewerId,
      )

      await this.auditLog.create({
        adminId: finalReviewerId,
        role: finalReviewerRole,
        action: 'article_final_review_reject',
        targetType: 'article',
        targetId: articleId,
        ip,
        detail: JSON.stringify({ comment: dto.finalReviewComment }),
      })

      return updated
    }

    throw new BadRequestException('无效的终审操作')
  }

  // ==================== 重新提交 ====================

  /**
   * 被驳回的稿件，作者修改后重新提交
   */
  async resubmit(
    articleId: number,
    userId: number,
    userRole: string,
    dto: ResubmitDto,
    ip?: string,
  ) {
    // 系统管理员不参与内容运营, 无重新提交权
    if (userRole === 'system_admin') {
      throw new ForbiddenException('系统管理员无重新提交权限, 请使用编辑员账号')
    }
    const article = await this.prisma.article.findUnique({ where: { id: articleId } })
    if (!article) throw new NotFoundException('稿件不存在')
    if (article.status !== ArticleStatus.REVIEW_REJECTED) {
      throw new BadRequestException(`当前状态 ${article.status} 不允许重新提交`)
    }
    if (article.authorId !== userId) {
      throw new ForbiddenException('只能重新提交自己的稿件')
    }

    const now = new Date()

    const updated = await this.prisma.article.update({
      where: { id: articleId },
      data: {
        status: ArticleStatus.PENDING_REVIEW,
        content: dto.content ?? article.content,
        summary: dto.summary ?? article.summary,
        encryptedContent: dto.encryptedContent ?? article.encryptedContent,
        reviewComment: null,
        reviewedAt: null,
        finalReviewerId: null,
        finalReviewComment: null,
        finalReviewedAt: null,
        submittedAt: now,
        reviewerId: null,
      },
    })

    // V2.0: 通知审核人员稿件重新提交
    const submitter = await this.prisma.admin.findUnique({ where: { id: userId } })
    await this.messageService.sendManuscriptSubmitted(
      article.id,
      article.title,
      userId,
      submitter?.nickname ?? submitter?.username ?? '用户',
    )

    await this.auditLog.create({
      adminId: userId,
      role: userRole,
      action: 'article_resubmit',
      targetType: 'article',
      targetId: articleId,
      ip,
    })

    return updated
  }

  // ==================== 撤回已发布稿件 ====================

  /**
   * 撤回已发布的稿件
   * 审核人员/栏目管理员可撤回
   */
  async withdraw(
    articleId: number,
    userId: number,
    userRole: string,
    dto: WithdrawDto,
    ip?: string,
    bindColumnIds: number[] = [],
  ) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } })
    if (!article) throw new NotFoundException('稿件不存在')
    if (article.status !== ArticleStatus.PUBLISHED) {
      throw new BadRequestException(`当前状态 ${article.status} 不允许撤回`)
    }

    // 权限分级:
    //   column_admin  → 仅可撤回授权栏目(含子栏目)内的稿件
    //   editor        → 仅可撤回自己作者本人的稿件
    //   reviewer/其它 → 仅可撤回自己作者本人的稿件(审核权不含撤回权)
    //   system_admin  → 无撤回权(系统管理员只负责系统配置/账号/栏目, 不参与内容运营)
    // 历史问题: 旧实现允许 system_admin 全局撤回, 与"系统管理员不参与内容运营"的职责划分不符
    if (userRole === 'system_admin') {
      throw new ForbiddenException('系统管理员无撤回权限, 请使用栏目管理员/编辑员账号')
    } else if (userRole === 'column_admin') {
      // 校验栏目归属(授权栏目含其子栏目)
      const allowed = await this.columnService.isColumnInAllowedSet(article.columnId, bindColumnIds)
      if (!allowed) {
        throw new ForbiddenException('无权撤回该栏目的稿件')
      }
    } else if (article.authorId !== userId) {
      // editor / reviewer / 其它角色: 仅作者本人
      throw new ForbiddenException('只能撤回自己的稿件')
    }

    const updated = await this.prisma.article.update({
      where: { id: articleId },
      data: {
        status: ArticleStatus.WITHDRAWN,
        isTop: false,
        pinLevel: null,
        pinExpireAt: null,
      },
    })

    await this.auditLog.create({
      adminId: userId,
      role: userRole,
      action: 'article_withdraw',
      targetType: 'article',
      targetId: articleId,
      ip,
      detail: JSON.stringify({ reason: dto.reason }),
    })

    this.articleIndexService.removeArticle(articleId).catch((err: any) => {
      this.logger.error(`移除搜索索引失败 articleId=${articleId}: ${err?.message ?? err}`)
    })

    return updated
  }

  // ==================== 置顶 ====================

  /**
   * 发布稿件置顶
   * 栏目管理员及以上可操作
   */
  async pinArticle(
    articleId: number,
    userId: number,
    userRole: string,
    dto: PinArticleDto,
    ip?: string,
  ) {
    // 系统管理员不参与内容运营, 无置顶权
    if (userRole === 'system_admin') {
      throw new ForbiddenException('系统管理员无置顶权限, 请使用栏目管理员账号')
    }
    const article = await this.prisma.article.findUnique({ where: { id: articleId } })
    if (!article) throw new NotFoundException('稿件不存在')
    if (article.status !== ArticleStatus.PUBLISHED) {
      throw new BadRequestException(`只有已发布的稿件才能置顶`)
    }

    // site_top 仅栏目管理员可用(原 system_admin 已被上方拦截, 此处放宽给 column_admin)
    if (dto.pinLevel === PinLevel.SITE_TOP && userRole !== 'column_admin') {
      throw new ForbiddenException('仅栏目管理员可设置全站置顶')
    }

    let pinExpireAt: Date | null = null
    if (dto.durationHours) {
      pinExpireAt = new Date(Date.now() + dto.durationHours * 60 * 60 * 1000)
    }

    const updated = await this.prisma.article.update({
      where: { id: articleId },
      data: {
        isTop: true,
        pinLevel: dto.pinLevel,
        pinExpireAt,
      },
    })

    await this.auditLog.create({
      adminId: userId,
      role: userRole,
      action: 'article_pin',
      targetType: 'article',
      targetId: articleId,
      ip,
      detail: JSON.stringify({ pinLevel: dto.pinLevel, durationHours: dto.durationHours }),
    })

    return updated
  }

  /**
   * 取消置顶
   */
  async unpinArticle(articleId: number, userId: number, userRole: string, ip?: string) {
    // 系统管理员不参与内容运营, 无取消置顶权
    if (userRole === 'system_admin') {
      throw new ForbiddenException('系统管理员无取消置顶权限, 请使用栏目管理员账号')
    }
    const article = await this.prisma.article.findUnique({ where: { id: articleId } })
    if (!article) throw new NotFoundException('稿件不存在')

    const updated = await this.prisma.article.update({
      where: { id: articleId },
      data: {
        isTop: false,
        pinLevel: null,
        pinExpireAt: null,
      },
    })

    await this.auditLog.create({
      adminId: userId,
      role: userRole,
      action: 'article_unpin',
      targetType: 'article',
      targetId: articleId,
      ip,
    })

    return updated
  }

  // ==================== 查询接口 ====================

  /**
   * 获取稿件详情
   */
  async findById(articleId: number, userId?: number, userRole?: string, bindColumnIds?: number[]) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: { attachments: true },
    })
    if (!article) throw new NotFoundException('稿件不存在')

    // 权限校验：仅当传入用户上下文时执行（内部调用如定时任务可不传）
    if (userId !== undefined) {
      const isAuthor = article.authorId === userId
      const isSystemAdmin = userRole === 'system_admin'
      const restrictedStatuses = [ArticleStatus.DRAFT, ArticleStatus.REVIEW_REJECTED, ArticleStatus.PENDING_REVIEW, ArticleStatus.FINAL_PENDING]
      if (restrictedStatuses.includes(article.status as any) && !isAuthor && !isSystemAdmin) {
        throw new ForbiddenException('无权查看此稿件')
      }
      // 已发布/归档稿件需校验栏目权限
      if (!isSystemAdmin && bindColumnIds !== undefined) {
        const allowed = await this.columnService.expandToDescendantIds(bindColumnIds)
        if (!allowed.includes(article.columnId)) {
          throw new ForbiddenException('无权查看此栏目的稿件')
        }
      }
    }

    // 转换附件为前端期望的格式
    // - images: URL 字符串数组（fileType === 'image'）
    // - attachments: 对象数组 {url, name}（fileType !== 'image'）
    const images = article.attachments
      .filter(a => a.fileType === 'image')
      .map(a => a.fileUrl)
    const attachments = article.attachments
      .filter(a => a.fileType !== 'image')
      .map(a => ({ url: a.fileUrl, name: a.name }))

    return {
      ...article,
      images,
      attachments,
    }
  }

  /**
   * 获取稿件关联的附件列表（通过 FileResourceService）
   */
  async findArticleAttachments(articleId: number, userRole: string, bindColumnIds: number[]) {
    // 先确认稿件存在
    const article = await this.prisma.article.findUnique({ where: { id: articleId } })
    if (!article) throw new NotFoundException('稿件不存在')

    return this.fileResourceService.findByArticleId(articleId, userRole, bindColumnIds)
  }

  /**
   * 查询草稿列表
   * 编辑/审核/栏目管理员: 只能看自己创建的草稿 (与 getById 的 isAuthor 校验保持一致, 避免列表可见但详情 403 的矛盾)
   * 系统管理员: 可看全站草稿
   */
  async findMyDrafts(authorId: number, authorRole: string, bindColumnIds: number[], query: {
    page?: number
    pageSize?: number
    keyword?: string
  }) {
    const { page = 1, pageSize = 10, keyword } = query
    const where: any = {
      status: ArticleStatus.DRAFT,
    }

    if (authorRole !== 'system_admin') {
      where.authorId = authorId
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { summary: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        // 草稿按最后编辑时间倒序: updatedAt DESC NULLS LAST + createdAt 兜底 + id 终极兜底
        orderBy: [
          { updatedAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.article.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  /**
   * 系统管理员全站稿件查询（只读，所有状态）
   * 含栏目名称和作者昵称
   */
  async findAllForSystemAdmin(query: {
    page?: number
    pageSize?: number
    keyword?: string
    columnId?: number
    status?: string
  }) {
    const { page = 1, pageSize = 10, keyword, columnId, status } = query
    const where: any = {}

    if (status) {
      where.status = status
    }
    if (columnId) {
      where.columnId = columnId
    }
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { summary: { contains: keyword } },
      ]
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          column: { select: { columnName: true } },
        },
        // 管理员全站视角: 最近有变动的稿件最优先
        //   updatedAt DESC NULLS LAST → 最后编辑时间倒序, NULL 排到最后
        //   createdAt DESC → 兜底 NULL updatedAt
        //   id DESC → 终极兜底, 翻页稳定
        orderBy: [
          { updatedAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.article.count({ where }),
    ])

    // 手动查询作者信息（Article 模型未定义 author 关联）
    const authorIds = [...new Set(articles.map((a) => a.authorId))]
    const authors = authorIds.length > 0
      ? await this.prisma.admin.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, nickname: true, username: true },
        })
      : []
    const authorMap = new Map(authors.map((a) => [a.id, a]))

    const list = articles.map((a) => ({
      ...a,
      columnName: a.column?.columnName || null,
      authorName: authorMap.get(a.authorId)?.nickname || authorMap.get(a.authorId)?.username || null,
    }))

    return { list, total, page, pageSize }
  }

  /**
   * 待初审列表
   */
  async findPendingReview(reviewerId: number, reviewerRole: string, bindColumnIds: number[], query: {
    page?: number
    pageSize?: number
    keyword?: string
    type?: string
  }) {
    const { page = 1, pageSize = 10, keyword, type } = query
    const where: any = {
      status: ArticleStatus.PENDING_REVIEW,
    }

    if (reviewerRole !== 'system_admin') {
      where.columnId = { in: await this.columnService.expandToDescendantIds(bindColumnIds) }
    }

    if (type) {
      where.type = type
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        // 排序语义: 最新提交/创建在最顶, 最旧在最底
        //   1. submittedAt DESC NULLS LAST → 有真实提交时间的, 按提交时间倒序, NULL 排到最后
        //   2. createdAt DESC → 兜底 NULL submittedAt(同一 NULL 组内按创建时间倒序)
        //   3. id DESC → 终极兜底, 保证翻页稳定不重复/不丢失
        // 注意: PG 默认 DESC 时 NULL 排第一, 必须显式 nulls: 'last' 才符合业务语义
        orderBy: [
          { submittedAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.article.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  /**
   * 待终审列表
   */
  async findPendingFinalReview(reviewerRole: string, bindColumnIds: number[], query: {
    page?: number
    pageSize?: number
    keyword?: string
    type?: string
  }) {
    const { page = 1, pageSize = 10, keyword, type } = query
    const where: any = {
      status: ArticleStatus.FINAL_PENDING,
    }

    if (reviewerRole !== 'system_admin') {
      where.columnId = { in: await this.columnService.expandToDescendantIds(bindColumnIds) }
    }

    if (type) {
      where.type = type
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: [
          { submittedAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.article.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  /**
   * 已发布列表
   */
  async findPublished(role: string, bindColumnIds: number[], query: {
    page?: number
    pageSize?: number
    keyword?: string
    columnId?: number
  }) {
    const { page = 1, pageSize = 10, keyword, columnId } = query
    const where: any = {
      status: ArticleStatus.PUBLISHED,
    }

    if (role !== 'system_admin') {
      const allowedIds = await this.columnService.expandToDescendantIds(bindColumnIds)
      if (columnId) {
        if (!allowedIds.includes(columnId)) {
          throw new ForbiddenException('无权查看此栏目的数据')
        }
        where.columnId = columnId
      } else {
        where.columnId = { in: allowedIds }
      }
    } else if (columnId) {
      where.columnId = columnId
    }
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { summary: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        // 已发布列表: 置顶优先 + 发布时间倒序 + 更新时间兜底 + id 兜底
        //   isTop DESC → 置顶稿件排最前(业务规则, 保留)
        //   publishedAt DESC NULLS LAST → 发布时间倒序, NULL 排到最后
        //   updatedAt DESC NULLS LAST → 兜底同 publishedAt 时, 按最近更新时间倒序(置顶稿件内"最新动态"在前)
        //   id DESC → 终极兜底, 翻页稳定
        orderBy: [
          { isTop: 'desc' },
          { publishedAt: { sort: 'desc', nulls: 'last' } },
          { updatedAt: { sort: 'desc', nulls: 'last' } },
          { id: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.article.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  /**
   * 驳回列表
   */
  async findRejected(userId: number, role: string, bindColumnIds: number[], query: {
    page?: number
    pageSize?: number
    keyword?: string
    type?: string
  }) {
    const { page = 1, pageSize = 10, keyword, type } = query
    const where: any = {
      status: ArticleStatus.REVIEW_REJECTED,
    }

    if (role === 'editor') {
      where.authorId = userId
    } else if (role !== 'system_admin') {
      where.columnId = { in: await this.columnService.expandToDescendantIds(bindColumnIds) }
    }

    if (type) {
      where.type = type
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        // 驳回列表: 驳回时间倒序 + createdAt 兜底 + id 终极兜底
        //   reviewedAt DESC NULLS LAST → 最近驳回在最前, NULL 排到最后
        //   createdAt DESC → 兜底 NULL reviewedAt
        //   id DESC → 终极兜底, 翻页稳定
        orderBy: [
          { reviewedAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.article.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  // ==================== 归档管理（模块十九） ====================

  /**
   * 手动归档稿件
   */
  async archiveArticle(
    articleId: number,
    operatorId: number,
    operatorRole: string,
    operatorName: string,
    ip?: string,
  ) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } })
    if (!article) throw new NotFoundException('稿件不存在')
    if (article.status === ArticleStatus.ARCHIVED) {
      throw new BadRequestException('稿件已归档')
    }
    if (article.status !== ArticleStatus.PUBLISHED && article.status !== ArticleStatus.WITHDRAWN) {
      throw new BadRequestException('只能归档已发布或已撤回的稿件')
    }

    const now = new Date()
    const updated = await this.prisma.article.update({
      where: { id: articleId },
      data: {
        status: ArticleStatus.ARCHIVED,
        archivedAt: now,
      },
    })

    // 写入归档日志
    await this.prisma.articleArchiveLog.create({
      data: {
        articleId,
        columnId: article.columnId,
        title: article.title,
        archiveType: ArchiveType.MANUAL,
        operatorId,
        operatorName,
        originalStatus: article.status,
        archiveDate: now,
        expireDate: article.expireDate,
        timeLabel: article.timeLabel,
      },
    })

    // 从搜索索引移除
    this.articleIndexService.removeArticle(articleId).catch((err: any) => {
      this.logger.error(`移除搜索索引失败 articleId=${articleId}: ${err?.message ?? err}`)
    })

    await this.auditLog.create({
      adminId: operatorId,
      role: operatorRole,
      action: 'article_archive',
      targetType: 'article',
      targetId: articleId,
      ip,
      detail: JSON.stringify({ title: article.title, archiveType: ArchiveType.MANUAL }),
    })

    return updated
  }

  /**
   * 恢复归档稿件（退回已发布状态）
   */
  async restoreArchivedArticle(
    articleId: number,
    operatorId: number,
    operatorRole: string,
    ip?: string,
  ) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } })
    if (!article) throw new NotFoundException('稿件不存在')
    if (article.status !== ArticleStatus.ARCHIVED) {
      throw new BadRequestException('只能恢复归档状态的稿件')
    }

    const updated = await this.prisma.article.update({
      where: { id: articleId },
      data: {
        status: ArticleStatus.PUBLISHED,
        archivedAt: null,
        archiveReminded: false,
      },
    })

    await this.auditLog.create({
      adminId: operatorId,
      role: operatorRole,
      action: 'article_restore_archive',
      targetType: 'article',
      targetId: articleId,
      ip,
      detail: JSON.stringify({ title: article.title }),
    })

    return updated
  }

  /**
   * 查询归档稿件列表
   */
  async findArchivedArticles(
    userRole: string,
    bindColumnIds: number[],
    query: { page: number; pageSize: number; keyword?: string; columnId?: number; timeLabel?: string; archiveType?: string },
  ) {
    const { page, pageSize, keyword, columnId, timeLabel, archiveType } = query
    const where: any = {
      status: ArticleStatus.ARCHIVED,
    }

    // 栏目隔离
    if (userRole !== 'system_admin') {
      const allowedIds = await this.columnService.expandToDescendantIds(bindColumnIds)
      if (columnId) {
        if (!allowedIds.includes(columnId)) {
          throw new ForbiddenException('无权查看此栏目的数据')
        }
        where.columnId = columnId
      } else {
        where.columnId = { in: allowedIds }
      }
    } else if (columnId) {
      where.columnId = columnId
    }
    if (keyword) {
      where.title = { contains: keyword }
    }
    if (timeLabel) {
      where.timeLabel = timeLabel
    }

    // 归档日志关联查询
    const logWhere: any = {}
    if (archiveType) {
      logWhere.archiveType = archiveType
    }

    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          column: { select: { id: true, columnName: true } },
          archiveLogs: {
            where: logWhere,
            orderBy: { archiveDate: 'desc' },
            take: 1,
          },
        },
        orderBy: { archivedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.article.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  /**
   * 查询归档日志
   */
  async findArchiveLogs(
    userRole: string,
    bindColumnIds: number[],
    query: { page: number; pageSize: number; columnId?: number; archiveType?: string; startDate?: string; endDate?: string },
  ) {
    const { page, pageSize, columnId, archiveType, startDate, endDate } = query
    const where: any = {}

    // 栏目隔离
    if (userRole !== 'system_admin') {
      where.columnId = { in: await this.columnService.expandToDescendantIds(bindColumnIds) }
    }
    if (columnId) {
      where.columnId = columnId
    }
    if (archiveType) {
      where.archiveType = archiveType
    }
    if (startDate || endDate) {
      where.archiveDate = {}
      if (startDate) where.archiveDate.gte = new Date(startDate)
      if (endDate) where.archiveDate.lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const [list, total] = await Promise.all([
      this.prisma.articleArchiveLog.findMany({
        where,
        orderBy: { archiveDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.articleArchiveLog.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  // ==================== 私有方法 ====================

  /**
   * 栏目权限校验（用于修改草稿时, 子栏目自动继承父栏目权限）
   */
  private async canAccessColumn(role: string, userId: number, columnId: number): Promise<boolean> {
    if (role === 'system_admin') return true
    const admin = await this.prisma.admin.findUnique({ where: { id: userId } })
    if (!admin) return false
    let bindColumnIds: number[] = []
    try { bindColumnIds = JSON.parse(admin.bindColumnIds || '[]') } catch {}
    return this.columnService.isColumnInAllowedSet(columnId, bindColumnIds)
  }
}