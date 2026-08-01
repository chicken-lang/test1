const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  console.log('========== 各操作类型的 detail 字段统计 ==========\n')

  // 按操作类型分组统计
  const groups = await p.auditLog.groupBy({
    by: ['action'],
    _count: { id: true },
    _min: { detail: true },
    orderBy: { _count: { id: 'desc' } },
  })

  console.log('操作类型分布:')
  groups.forEach(g => {
    console.log(`  ${g.action}: ${g._count.id} 条`)
  })

  // 每种操作类型取一条样本
  console.log('\n各操作类型 detail 样本:')
  for (const g of groups) {
    const sample = await p.auditLog.findFirst({
      where: { action: g.action },
      select: { id: true, detail: true },
    })
    console.log(`  [${g.action}] (${g._count.id}条) → detail: ${sample?.detail || 'NULL'}`)
  }

  // 统计 detail 为 null 的操作类型
  const nullDetail = await p.auditLog.groupBy({
    by: ['action'],
    where: { detail: null },
    _count: { id: true },
  })
  console.log('\ndetail 为 NULL 的操作类型:')
  nullDetail.forEach(g => {
    console.log(`  ${g.action}: ${g._count.id} 条`)
  })
}

main().then(() => p.$disconnect()).catch(e => console.error(e.message))
