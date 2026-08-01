// Test pg with SSL disabled
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const pool = new Pool({
    user: 'jwc',
    host: '127.0.0.1',
    port: 5432,
    database: 'jwc_dev',
    ssl: false
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected via pg (no SSL)!');
    
    const result = await client.query('SELECT 1 as test');
    console.log('Query:', result.rows);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

main();