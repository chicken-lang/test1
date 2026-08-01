// Test using pg Client directly
import pg from 'pg';

const { Client } = pg;

async function main() {
  const client = new Client({
    user: 'jwc',
    password: '123456',
    host: '127.0.0.1',
    port: 5432,
    database: 'jwc_dev',
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected via pg Client!');
    
    const result = await client.query('SELECT 1 as test');
    console.log('Query:', result.rows);
    
    await client.end();
    console.log('🔌 Disconnected');
  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
  }
}

main();