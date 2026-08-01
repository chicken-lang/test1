const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  console.log('========== 审计日志 detail 字段检查 ==========\n')

  // 统计 detail 字段情况
  const total = await p.auditLog.count()
  const withDetail = await p.auditLog.count({ where: { detail: { not: null } } })
  const withNonEmptyDetail = await p.auditLog.count({
    where: { detail: { not: null, not: '' } }
  })

  console.log(`总日志数: ${total}`)
  console.log(`detail 非 null: ${withDetail}`)
  console.log(`detail 非空字符串: ${withNonEmptyDetail}`)

  // 查看前10条日志的 detail 字段
  const logs = await p.auditLog.findMany({
    orderBy: { id: 'desc' },
    take: 10,
    select: { id: true, action: true, detail: true, username: true }
  })

  console.log('\n最近10条日志的 detail 字段:')
  logs.forEach(log => {
    console.log(`  ID=${log.id} | action=${log.action} | user=${log.username} | detail=${log.detail ? log.detail.substring(0, 100) : 'NULL'}`)
  })
}

main().then(() => p.$disconnect()).catch(e => { console.error('错误:', e.message); process.exit(1) })
