import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { Client } from '@elastic/elasticsearch'

export interface EsSearchResult<T = unknown> {
  total: number
  list: T[]
}

@Injectable()
export class ElasticsearchService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ElasticsearchService.name)
  private client: Client | null = null
  private available = false
  private readonly indexName = process.env.ES_INDEX || 'jwc_articles'

  async onModuleInit() {
    const node = process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    const maxRetries = 5
    let retries = 0

    while (retries < maxRetries) {
      try {
        this.client = new Client({ node })
        const info = await this.client.info()
        this.available = true
        this.logger.log(`Elasticsearch 连接成功: ${info.version.number}`)

        await this.ensureIndex()
        return
      } catch (err: any) {
        retries++
        this.logger.warn(`Elasticsearch 连接失败 (${retries}/${maxRetries}): ${err.message}`)
        if (retries >= maxRetries) {
          this.logger.warn('Elasticsearch 不可用，搜索将降级到数据库 LIKE 查询')
          this.client = null
        } else {
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.available = false
      this.logger.log('Elasticsearch 连接已关闭')
    }
  }

  isAvailable(): boolean {
    return this.available && this.client !== null
  }

  /**
   * 确保文章索引存在（含 IK 中文分词器 mapping）
   */
  private async ensureIndex() {
    if (!this.client) return
    try {
      const exists = await this.client.indices.exists({ index: this.indexName })
      if (exists) {
        this.logger.log(`索引 ${this.indexName} 已存在`)
        return
      }

      await this.client.indices.create({
        index: this.indexName,
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              ik_smart_analyzer: {
                type: 'custom',
                tokenizer: 'ik_smart',
              },
              ik_max_word_analyzer: {
                type: 'custom',
                tokenizer: 'ik_max_word',
              },
            },
          },
        },
        mappings: {
          properties: {
            articleId: { type: 'integer' },
            title: {
              type: 'text',
              analyzer: 'ik_max_word',
              search_analyzer: 'ik_smart',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            content: {
              type: 'text',
              analyzer: 'ik_max_word',
              search_analyzer: 'ik_smart',
            },
            summary: {
              type: 'text',
              analyzer: 'ik_max_word',
              search_analyzer: 'ik_smart',
            },
            columnId: { type: 'integer' },
            columnName: { type: 'keyword' },
            columnSlug: { type: 'keyword' },
            status: { type: 'keyword' },
            visibility: { type: 'keyword' },
            type: { type: 'keyword' },
            publishedAt: { type: 'date' },
            viewCount: { type: 'integer' },
            isTop: { type: 'boolean' },
            attachmentNames: {
              type: 'text',
              analyzer: 'ik_max_word',
            },
          },
        },
      })
      this.logger.log(`索引 ${this.indexName} 创建成功`)
    } catch (err: any) {
      this.logger.error(`索引创建失败: ${err.message}`)
    }
  }

  /**
   * 索引单篇文章
   */
  async indexArticle(article: Record<string, any>): Promise<void> {
    if (!this.isAvailable() || !this.client) return
    try {
      const doc = {
        articleId: article.id,
        title: article.title,
        content: article.content || '',
        summary: article.summary || '',
        columnId: article.columnId,
        columnName: article.column?.columnName || '',
        columnSlug: article.column?.columnSlug || '',
        status: article.status,
        visibility: article.visibility,
        type: article.type || 'normal',
        publishedAt: article.publishedAt,
        viewCount: article.viewCount || 0,
        isTop: article.isTop || false,
        attachmentNames: (article.attachments || []).map((a: any) => a.name).join(' '),
      }

      await this.client.index({
        index: this.indexName,
        id: String(article.id),
        document: doc,
      })
    } catch (err: any) {
      this.logger.warn(`文章索引失败 [${article.id}]: ${err.message}`)
    }
  }

  /**
   * 批量索引文章
   */
  async bulkIndexArticles(articles: Record<string, any>[]): Promise<void> {
    if (!this.isAvailable() || !this.client || articles.length === 0) return
    try {
      const operations: any[] = []
      for (const article of articles) {
        operations.push({ index: { _index: this.indexName, _id: String(article.id) } })
        operations.push({
          articleId: article.id,
          title: article.title,
          content: article.content || '',
          summary: article.summary || '',
          columnId: article.columnId,
          columnName: article.column?.columnName || '',
          columnSlug: article.column?.columnSlug || '',
          status: article.status,
          visibility: article.visibility,
          type: article.type || 'normal',
          publishedAt: article.publishedAt,
          viewCount: article.viewCount || 0,
          isTop: article.isTop || false,
          attachmentNames: (article.attachments || []).map((a: any) => a.name).join(' '),
        })
      }
      await this.client.bulk({ operations, refresh: true })
      this.logger.log(`批量索引 ${articles.length} 篇文章成功`)
    } catch (err: any) {
      this.logger.warn(`批量索引失败: ${err.message}`)
    }
  }

  /**
   * 删除文章索引
   */
  async deleteArticle(articleId: number): Promise<void> {
    if (!this.isAvailable() || !this.client) return
    try {
      await this.client.delete({
        index: this.indexName,
        id: String(articleId),
      })
    } catch (err: any) {
      if (err.meta?.statusCode !== 404) {
        this.logger.warn(`文章索引删除失败 [${articleId}]: ${err.message}`)
      }
    }
  }

  /**
   * 全文检索（核心方法）
   */
  async search(
    keyword: string,
    filters: {
      columnIds?: number[]
      status?: string
      visibilities?: string[]
      startDate?: Date
      endDate?: Date
      type?: string
    },
    page: number,
    pageSize: number,
  ): Promise<EsSearchResult> {
    if (!this.isAvailable() || !this.client) {
      return { total: 0, list: [] }
    }

    const from = (page - 1) * pageSize

    const must: any[] = [
      {
        multi_match: {
          query: keyword,
          fields: ['title^3', 'summary^2', 'content', 'attachmentNames'],
          type: 'best_fields',
          analyzer: 'ik_smart',
        },
      },
    ]

    if (filters.columnIds && filters.columnIds.length > 0) {
      must.push({ terms: { columnId: filters.columnIds } })
    }
    if (filters.status) {
      must.push({ term: { status: filters.status } })
    }
    if (filters.visibilities && filters.visibilities.length > 0) {
      must.push({ terms: { visibility: filters.visibilities } })
    }
    if (filters.type) {
      must.push({ term: { type: filters.type } })
    }

    const range: any = {}
    if (filters.startDate) range.gte = filters.startDate.toISOString()
    if (filters.endDate) {
      const end = new Date(filters.endDate)
      end.setHours(23, 59, 59, 999)
      range.lte = end.toISOString()
    }
    if (Object.keys(range).length > 0) {
      must.push({ range: { publishedAt: range } })
    }

    const query = { bool: { must } }

    try {
      const [hitsResult, countResult] = await Promise.all([
        this.client.search({
          index: this.indexName,
          query,
          from,
          size: pageSize,
          highlight: {
            fields: {
              title: {},
              summary: {},
              content: {},
            },
          },
          sort: [
            { _score: { order: 'desc' } },
            { publishedAt: { order: 'desc' } },
          ],
        }),
        this.client.count({
          index: this.indexName,
          query,
        }),
      ])

      const list = hitsResult.hits.hits.map((hit: any) => {
        const source = hit._source
        const highlight = hit.highlight || {}
        return {
          articleId: source.articleId,
          title: (highlight.title?.[0] || source.title),
          summary: (highlight.summary?.[0] || highlight.content?.[0] || source.summary || ''),
          columnId: source.columnId,
          columnName: source.columnName,
          columnSlug: source.columnSlug,
          publishedAt: source.publishedAt,
          viewCount: source.viewCount,
          isTop: source.isTop,
          highlightField: this.detectHighlightField(highlight),
        }
      })

      return { total: countResult.count, list }
    } catch (err: any) {
      this.logger.warn(`Elasticsearch 搜索失败: ${err.message}`)
      return { total: 0, list: [] }
    }
  }

  private detectHighlightField(highlight: Record<string, string[]>): 'title' | 'content' | 'attachment' | null {
    if (highlight.title?.length) return 'title'
    if (highlight.content?.length) return 'content'
    if (highlight.attachmentNames?.length) return 'attachment'
    return null
  }
}