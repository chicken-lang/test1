const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const admins = await p.admin.findMany({
    where: { role: 'system_admin' },
    select: { id: true, username: true, passwordHash: true, status: true, nickname: true },
    take: 5,
  })
  admins.forEach(a => {
    console.log(`id=${a.id} username=${a.username} nickname=${a.nickname} status=${a.status}`)
    console.log(`  passwordHash=${a.passwordHash?.substring(0, 60)}...`)
    console.log(`  hash length=${a.passwordHash?.length}`)
  })
}
main().then(() => p.$disconnect()).catch(e => console.error(e.message))
