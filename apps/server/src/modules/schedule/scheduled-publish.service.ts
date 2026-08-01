import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { MessageService } from '../message/message.service.js';
import { ArticleStatus } from '../article/article.constants.js';

@Injectable()
export class ScheduledPublishService {
  private readonly logger = new Logger(ScheduledPublishService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditLogService) private readonly auditLog: AuditLogService,
    @Inject(MessageService) private readonly messageService: MessageService,
  ) {}

  /**
   * 每分钟扫描一次待定时发布的稿件
   * CRON: * * * * * (每分钟执行)
   */
  @Cron('* * * * *')
  async handleScheduledPublish() {
    const now = new Date();
    this.logger.debug(`[定时发布扫描] 开始执行，当前时间: ${now.toISOString()}`);

    try {
      // 查询所有已终审通过且定时发布时间已到的稿件
      const pendingArticles = await this.prisma.article.findMany({
        where: {
          status: ArticleStatus.FINAL_PENDING,
          scheduledPublishAt: {
            lte: now,
            not: null,
          },
        },
        include: {
          column: true,
        },
      });

      if (pendingArticles.length === 0) {
        this.logger.debug('[定时发布扫描] 暂无待发布稿件');
        return;
      }

      this.logger.log(`[定时发布扫描] 发现 ${pendingArticles.length} 篇待定时发布稿件`);

      for (const article of pendingArticles) {
        try {
          await this.publishArticle(article);
        } catch (error) {
          this.logger.error(
            `[定时发布扫描] 稿件 ${article.id} 发布失败: ${error.message}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error(`[定时发布扫描] 扫描任务执行失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 发布单篇稿件
   */
  private async publishArticle(article: any) {
    // 更新稿件状态为已发布
    const updatedArticle = await this.prisma.article.update({
      where: { id: article.id },
      data: {
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        scheduledPublishAt: null, // 清空定时发布时间
      },
    });

    this.logger.log(`[定时发布扫描] 稿件 ${article.id} 《${article.title}》已定时发布`);

    // 记录审计日志
    await this.auditLog.create({
      adminId: article.finalReviewerId || article.authorId,
      role: 'system_admin', // 系统自动发布
      action: 'article_scheduled_publish',
      targetType: 'article',
      targetId: article.id,
      detail: JSON.stringify({
        title: article.title,
        columnId: article.columnId,
        scheduledPublishAt: article.scheduledPublishAt?.toISOString(),
      }),
    });

    // 发送站内消息通知作者
    await this.messageService.createMessage({
      type: 'notice',
      title: '稿件已定时发布',
      content: `您的稿件《${article.title}》已按照预定时间发布。`,
      receiverId: article.authorId,
      bizType: 'manuscript',
      bizId: article.id,
      action: 'publish',
    });
  }

  /**
   * 手动触发定时发布扫描（用于测试）
   */
  async triggerScan() {
    await this.handleScheduledPublish();
  }
}
