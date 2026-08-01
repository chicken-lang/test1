// Test with localhost
import pg from 'pg';

const { Client } = pg;

async function main() {
  const client = new Client({
    user: 'jwc',
    password: '123456',
    host: 'localhost',
    port: 5432,
    database: 'jwc_dev',
    ssl: false,
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log('✅ Connected via localhost!');
    
    const result = await client.query('SELECT 1 as test');
    console.log('Query:', result.rows);
    
    await client.end();
  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error('Code:', error.code);
  }
}

main();