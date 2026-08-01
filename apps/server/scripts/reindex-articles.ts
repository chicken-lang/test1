/**
 * 批量将已发布文章导入 Elasticsearch 索引
 *
 * 用法:
 *   cd apps/server
 *   node node_modules/tsx/dist/cli.mjs scripts/reindex-articles.ts
 *
 * 或在 package.json 中添加:
 *   "scripts": { "reindex": "tsx scripts/reindex-articles.ts" }
 *   然后执行: pnpm --filter @jwc/server reindex
 */
import { PrismaClient } from '@prisma/client'
import { Client } from '@elastic/elasticsearch'

const prisma = new PrismaClient()
const esNode = process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
const indexName = process.env.ES_INDEX || 'jwc_articles'
const es = new Client({ node: esNode })

async function main() {
  console.log(`ES node: ${esNode}`)
  console.log(`Index: ${indexName}`)

  // 1. 检查 ES 连接
  const info = await es.info()
  console.log(`ES 连接成功: ${info.version.number}`)

  // 2. 查询所有已发布文章（含栏目和附件）
  const articles = await prisma.article.findMany({
    where: { status: 'published', deletedAt: null },
    include: {
      column: { select: { columnName: true, columnSlug: true } },
      attachments: { select: { name: true } },
    },
    orderBy: { publishedAt: 'desc' },
  })

  console.log(`数据库中已发布文章: ${articles.length} 篇`)

  if (articles.length === 0) {
    console.log('没有已发布文章，退出')
    return
  }

  // 3. 构建批量操作
  const operations: any[] = []
  for (const article of articles) {
    operations.push({ index: { _index: indexName, _id: String(article.id) } })
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
      attachmentNames: (article.attachments || []).map((a) => a.name).join(' '),
    })
  }

  // 4. 执行批量索引
  const result = await es.bulk({ operations, refresh: true })

  if (result.errors) {
    const failed = result.items.filter(
      (item: any) => item.index?.error,
    )
    console.error(`批量索引部分失败: ${failed.length}/${articles.length}`)
    for (const f of failed.slice(0, 5)) {
      console.error(`  文章 ID ${f.index._id}: ${f.index.error?.type} - ${f.index.error?.reason}`)
    }
  } else {
    console.log(`批量索引 ${articles.length} 篇文章成功`)
  }

  // 5. 验证
  const count = await es.count({ index: indexName })
  console.log(`ES 索引 ${indexName} 当前文档数: ${count.count}`)
}

main()
  .then(() => {
    console.log('Done')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Reindex failed:', err.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await es.close()
  })
