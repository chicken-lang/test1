import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service.js'

/**
 * 文章索引生命周期管理
 * 负责在文章发布/更新/删除时同步到 ES
 */
@Injectable()
export class ArticleIndexService {
  private readonly logger = new Logger(ArticleIndexService.name)

  constructor(
    private prisma: PrismaService,
    private esService: ElasticsearchService,
  ) {}

  /**
   * 全量同步所有已发布文章到 ES
   * 用于初始化或重建索引
   */
  async fullSync(): Promise<{ synced: number; failed: number }> {
    if (!this.esService.isAvailable()) {
      this.logger.warn('Elasticsearch 不可用，跳过全量同步')
      return { synced: 0, failed: 0 }
    }

    const articles = await this.prisma.article.findMany({
      where: { status: 'published', deletedAt: null },
      include: {
        column: { select: { columnName: true, columnSlug: true } },
        attachments: { select: { name: true } },
      },
    })

    let synced = 0
    let failed = 0

    for (const article of articles) {
      try {
        await this.esService.indexArticle(article)
        synced++
      } catch {
        failed++
      }
    }

    this.logger.log(`全量同步完成: 成功 ${synced}, 失败 ${failed}`)
    return { synced, failed }
  }

  /**
   * 单篇文章发布/更新时同步
   */
  async syncArticle(articleId: number): Promise<void> {
    if (!this.esService.isAvailable()) return

    try {
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        include: {
          column: { select: { columnName: true, columnSlug: true } },
          attachments: { select: { name: true } },
        },
      })

      if (!article || article.status !== 'published') {
        // 未发布或已删除 → 从索引中移除
        await this.esService.deleteArticle(articleId)
        return
      }

      await this.esService.indexArticle(article)
    } catch (err: any) {
      this.logger.warn(`文章同步索引失败 [${articleId}]: ${err.message}`)
    }
  }

  /**
   * 文章删除时从 ES 移除
   */
  async removeArticle(articleId: number): Promise<void> {
    await this.esService.deleteArticle(articleId)
  }
}