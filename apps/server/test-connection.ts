// Simple test script to verify PostgreSQL connection
import { PrismaClient } from '@prisma/client';

async function main() {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://jwc:jwc_dev_pwd_change_me@127.0.0.1:5432/jwc_dev?schema=public'
        }
      }
    });
    
    await prisma.$connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Query result:', result);
    
    await prisma.$disconnect();
    console.log('🔌 Disconnected');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

main();