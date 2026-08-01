import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const admins = await prisma.admin.findMany({ take: 3 })
  console.log('Admins:', JSON.stringify(admins.map(a => ({
    id: a.id, username: a.username, role: a.role, status: a.status
  })), null, 2))

  const columns = await prisma.column.findMany({ take: 5 })
  console.log('Columns:', JSON.stringify(columns.map(c => ({
    id: c.id, columnName: c.columnName, columnSlug: c.columnSlug,
    sortOrder: c.sortOrder, status: c.status, parentId: c.parentId
  })), null, 2))
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())