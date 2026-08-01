// Test Prisma Client connection directly
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://jwc:jwc_dev_pwd_change_me@127.0.0.1:5432/jwc_dev?schema=public'
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('✅ Prisma Client connected successfully!');
    
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Query result:', result);
    
    await prisma.$disconnect();
    console.log('🔌 Disconnected');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

main();