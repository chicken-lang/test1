/**
 * 稿件时效标签自动归档服务（模块十九）
 *
 * 三个定时任务：
 * 1. Job-1 (02:00): 扫描 7 天内到期的稿件，向栏目管理员发送提醒
 * 2. Job-2 (02:30): 自动归档已过期的 INSTANT 稿件
 * 3. Job-3 (周一 08:00): 生成本周归档统计周报
 */

import { Injectable, Logger, Inject } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service.js'
import { MessageService } from '../message/message.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import { ArticleStatus, ArchiveType, TimeLabel } from '../article/article.constants.js'

@Injectable()
export class ArticleExpiryService {
  private readonly logger = new Logger(ArticleExpiryService.name)

  private prisma: PrismaService
  private messageService: MessageService
  private auditLog: AuditLogService

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(MessageService) messageService: MessageService,
    @Inject(AuditLogService) auditLog: AuditLogService,
  ) {
    this.prisma = prisma
    this.messageService = messageService
    this.auditLog = auditLog
  }

  /**
   * Job-1: 每日 02:00 扫描 7 天内到期的稿件
   * 向稿件作者和栏目管理员发送站内消息提醒
   */
  @Cron('0 2 * * *')
  async scanExpiringArticles() {
    this.logger.log('开始扫描 7 天内到期稿件...')
    try {
      const now = new Date()
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      // 查询已发布、有时效标签、未提醒过、7天内到期的稿件
      const expiring = await this.prisma.article.findMany({
        where: {
          status: ArticleStatus.PUBLISHED,
          timeLabel: { in: [TimeLabel.SEMESTER, TimeLabel.INSTANT] },
          archiveReminded: false,
          expireDate: {
            gte: now,
            lte: sevenDaysLater,
          },
        },
        include: {
          column: { select: { id: true, columnName: true } },
          author: { select: { id: true, nickname: true, username: true } },
        } as any,
      })

      this.logger.log(`找到 ${expiring.length} 篇即将到期的稿件`)

      for (const article of expiring) {
        const daysLeft = Math.ceil(
          (article.expireDate!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        )
        const articleAny = article as any
        const authorName = articleAny.author?.nickname || articleAny.author?.username || '编辑'

        // 发送给稿件作者
        await this.messageService.sendSystemNotification(
          article.authorId,
          `稿件即将到期提醒`,
          `您的稿件《${article.title}》将于 ${daysLeft} 天后到期（${article.expireDate!.toISOString().slice(0, 10)}），请及时处理。`,
        )

        // 通知该栏目绑定的管理员
        const columnAdmins = await this.prisma.admin.findMany({
          where: {
            role: 'column_admin',
            status: 'active',
          },
        })

        for (const admin of columnAdmins) {
          let bindColumnIds: number[] = []
          try {
            bindColumnIds = JSON.parse(admin.bindColumnIds || '[]')
          } catch {}

          if (bindColumnIds.includes(article.columnId)) {
            await this.messageService.sendSystemNotification(
              admin.id,
              `栏目稿件到期提醒`,
              `栏目"${articleAny.column?.columnName}"中的稿件《${article.title}》将于 ${daysLeft} 天后到期，请安排归档或延期。`,
            )
          }
        }

        // 标记已提醒
        await this.prisma.article.update({
          where: { id: article.id },
          data: { archiveReminded: true },
        })
      }

      this.logger.log(`到期提醒发送完成，共提醒 ${expiring.length} 篇稿件`)
    } catch (error) {
      this.logger.error(`扫描到期稿件失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Job-2: 每日 02:30 自动归档已过期稿件
   * 自动归档 expireDate 已过期的 INSTANT 类型稿件
   */
  @Cron('30 2 * * *')
  async autoArchiveExpiredArticles() {
    this.logger.log('开始自动归档过期稿件...')
    try {
      const now = new Date()

      // 查询已发布、已过期的即时办理类稿件
      const expired = await this.prisma.article.findMany({
        where: {
          status: ArticleStatus.PUBLISHED,
          timeLabel: TimeLabel.INSTANT,
          expireDate: { lt: now },
        },
        include: {
          column: { select: { id: true, columnName: true } },
        },
      })

      this.logger.log(`找到 ${expired.length} 篇已过期的稿件待归档`)

      for (const article of expired) {
        try {
          // 更新稿件状态为已归档
          await this.prisma.article.update({
            where: { id: article.id },
            data: {
              status: ArticleStatus.ARCHIVED,
              archivedAt: now,
            },
          })

          // 写入归档日志
          await this.prisma.articleArchiveLog.create({
            data: {
              articleId: article.id,
              columnId: article.columnId,
              title: article.title,
              archiveType: ArchiveType.AUTO_EXPIRY,
              originalStatus: ArticleStatus.PUBLISHED,
              archiveDate: now,
              expireDate: article.expireDate,
              timeLabel: article.timeLabel,
            },
          })

          // 通知作者
          await this.messageService.sendSystemNotification(
            article.authorId,
            `稿件已自动归档`,
            `您的稿件《${article.title}》已到期，系统已自动归档。如需恢复，请联系栏目管理员。`,
          )

          this.logger.log(`稿件 #${article.id}《${article.title}》已自动归档`)
        } catch (err) {
          this.logger.error(`归档稿件 #${article.id} 失败: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      this.logger.log(`自动归档完成，共归档 ${expired.length} 篇稿件`)
    } catch (error) {
      this.logger.error(`自动归档失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Job-3: 每周一 08:00 生成本周归档统计周报
   * 向系统管理员发送本周归档汇总
   */
  @Cron('0 8 * * 1')
  async generateWeeklyArchiveReport() {
    this.logger.log('开始生成归档周报...')
    try {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // 统计本周归档数据
      const [totalArchived, autoExpiryCount, autoSemesterCount, manualCount] = await Promise.all([
        this.prisma.articleArchiveLog.count({
          where: { archiveDate: { gte: weekAgo, lte: now } },
        }),
        this.prisma.articleArchiveLog.count({
          where: {
            archiveDate: { gte: weekAgo, lte: now },
            archiveType: ArchiveType.AUTO_EXPIRY,
          },
        }),
        this.prisma.articleArchiveLog.count({
          where: {
            archiveDate: { gte: weekAgo, lte: now },
            archiveType: ArchiveType.AUTO_SEMESTER,
          },
        }),
        this.prisma.articleArchiveLog.count({
          where: {
            archiveDate: { gte: weekAgo, lte: now },
            archiveType: ArchiveType.MANUAL,
          },
        }),
      ])

      // 查询即将到期稿件数量（7天内）
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcomingExpiry = await this.prisma.article.count({
        where: {
          status: ArticleStatus.PUBLISHED,
          timeLabel: { in: [TimeLabel.SEMESTER, TimeLabel.INSTANT] },
          expireDate: { gte: now, lte: sevenDaysLater },
        },
      })

      // 向系统管理员发送周报
      const systemAdmins = await this.prisma.admin.findMany({
        where: { role: 'system_admin', status: 'active' },
      })

      const reportContent = [
        `本周稿件归档统计周报`,
        `统计周期：${weekAgo.toISOString().slice(0, 10)} ~ ${now.toISOString().slice(0, 10)}`,
        ``,
        `【归档总量】${totalArchived} 篇`,
        `  - 即时办理到期自动归档：${autoExpiryCount} 篇`,
        `  - 学期结束自动归档：${autoSemesterCount} 篇`,
        `  - 手动归档：${manualCount} 篇`,
        ``,
        `【预警】未来 7 天内即将到期稿件：${upcomingExpiry} 篇`,
      ].join('\n')

      for (const admin of systemAdmins) {
        await this.messageService.sendSystemNotification(
          admin.id,
          `归档周报 ${now.toISOString().slice(0, 10)}`,
          reportContent,
        )
      }

      this.logger.log(`归档周报已发送给 ${systemAdmins.length} 位系统管理员`)
    } catch (error) {
      this.logger.error(`生成归档周报失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 手动触发学期结束批量归档
   * 供管理员通过 API 主动调用
   */
  async triggerSemesterArchive(operatorId: number, operatorRole: string) {
    this.logger.log('开始执行学期批量归档...')
    const now = new Date()
    let archivedCount = 0

    try {
      const semesterArticles = await this.prisma.article.findMany({
        where: {
          status: ArticleStatus.PUBLISHED,
          timeLabel: TimeLabel.SEMESTER,
        },
      })

      for (const article of semesterArticles) {
        try {
          await this.prisma.article.update({
            where: { id: article.id },
            data: {
              status: ArticleStatus.ARCHIVED,
              archivedAt: now,
            },
          })

          await this.prisma.articleArchiveLog.create({
            data: {
              articleId: article.id,
              columnId: article.columnId,
              title: article.title,
              archiveType: ArchiveType.AUTO_SEMESTER,
              operatorId,
              originalStatus: ArticleStatus.PUBLISHED,
              archiveDate: now,
              expireDate: article.expireDate,
              timeLabel: article.timeLabel,
            },
          })

          await this.messageService.sendSystemNotification(
            article.authorId,
            `稿件已归档（学期结束）`,
            `学期结束，您的稿件《${article.title}》已被批量归档。`,
          )

          archivedCount++
        } catch (err) {
          this.logger.error(`归档稿件 #${article.id} 失败: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      this.logger.log(`学期批量归档完成，共归档 ${archivedCount} 篇稿件`)
      return { archivedCount, total: semesterArticles.length }
    } catch (error) {
      this.logger.error(`学期批量归档失败: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }
}
