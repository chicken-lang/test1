import { config } from 'dotenv'
config()
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex')
}

async function main() {
  const admin = await prisma.admin.findUnique({ where: { username: 'editor' } })
  if (!admin) {
    console.log('NOT FOUND')
    return
  }
  console.log('username:', admin.username)
  console.log('passwordHash:', admin.passwordHash)
  console.log('status:', admin.status)
  
  const sha256Hex = sha256('123456')
  console.log('sha256(123456):', sha256Hex)
  
  const isValid = await bcrypt.compare(sha256Hex, admin.passwordHash)
  console.log('bcrypt.compare(sha256, hash):', isValid)
  
  const isValidPlain = await bcrypt.compare('123456', admin.passwordHash)
  console.log('bcrypt.compare(123456, hash):', isValidPlain)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
