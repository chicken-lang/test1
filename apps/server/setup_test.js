import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'

const prisma = new PrismaClient()
const ROUNDS = 12

async function main() {
  // Create a column_admin user with known password
  const plaintext = 'admin123'
  const sha256Hex = createHash('sha256').update(plaintext).digest('hex')
  const passwordHash = await bcrypt.hash(sha256Hex, ROUNDS)

  const user = await prisma.admin.upsert({
    where: { username: 'column_admin' },
    update: { passwordHash, status: 'active' },
    create: {
      username: 'column_admin',
      passwordHash,
      role: 'column_admin',
      nickname: '栏目管理员',
      status: 'active',
      email: 'admin@test.com',
    },
  })
  console.log('User created:', { id: user.id, username: user.username, role: user.role })

  // Create editor user
  const editorHash = await bcrypt.hash(sha256Hex, ROUNDS)
  const editor = await prisma.admin.upsert({
    where: { username: 'editor' },
    update: { passwordHash: editorHash, status: 'active' },
    create: {
      username: 'editor',
      passwordHash: editorHash,
      role: 'editor',
      nickname: '编辑',
      status: 'active',
      email: 'editor@test.com',
    },
  })
  console.log('Editor created:', { id: editor.id, username: editor.username, role: editor.role })

  // Ensure role permissions exist for column_admin
  const perm = await prisma.rolePermission.upsert({
    where: { role: 'column_admin' },
    update: {},
    create: {
      role: 'column_admin',
      roleName: '栏目管理员',
      permissions: JSON.stringify([
        'COLUMN_MANAGE', 'COLUMN_SORT', 'COLUMN_DISABLE',
        'ARTICLE_CREATE', 'ARTICLE_EDIT', 'ARTICLE_VIEW',
      ]),
    },
  })
  console.log('Permissions:', perm.role)

  // Add more test columns if not enough
  const count = await prisma.column.count()
  console.log('Existing columns:', count)

  if (count < 5) {
    const cols = [
      { columnName: '部门概况', columnSlug: 'about', sortOrder: 1 },
      { columnName: '通知公告', columnSlug: 'notice', sortOrder: 2 },
      { columnName: '教学建设', columnSlug: 'teaching', sortOrder: 3 },
      { columnName: '教学运行', columnSlug: 'operation', sortOrder: 4 },
      { columnName: '考务管理', columnSlug: 'exam', sortOrder: 5 },
    ]
    for (const c of cols) {
      await prisma.column.upsert({
        where: { columnSlug: c.columnSlug },
        update: {},
        create: { ...c, status: 'ACTIVE' },
      })
    }
    console.log('Test columns created')
  }

  console.log('Done. Test password is:', plaintext)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())