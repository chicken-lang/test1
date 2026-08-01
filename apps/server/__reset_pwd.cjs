const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const p = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('123456', 12)
  await p.admin.update({
    where: { username: 'system_admin' },
    data: { passwordHash: hash },
  })
  console.log('✅ system_admin 密码已重置为 123456')
}
main().then(() => p.$disconnect()).catch(e => console.error(e.message))
