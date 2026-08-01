// 查询 RSA 密钥
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const keys = await prisma.sysRsaKey.findMany({
    select: {
      id: true,
      version: true,
      isActive: true,
      createdBy: true,
      createdAt: true,
    },
  })
  
  console.log('RSA 密钥列表:')
  keys.forEach(k => {
    console.log(`  ID: ${k.id}, Version: ${k.version}, Active: ${k.isActive}, By: ${k.createdBy}, At: ${k.createdAt}`)
  })
  
  if (keys.length === 0) {
    console.log('  (无密钥记录)')
  }
  
  await prisma.$disconnect()
}

main()