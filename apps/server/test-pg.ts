// Test with raw pg library
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const pool = new Pool({
    user: 'jwc',
    password: 'jwc_dev_pwd_change_me',
    host: '127.0.0.1',
    port: 5432,
    database: 'jwc_dev',
    schema: 'public'
  });

  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL via pg!');
    
    const result = await client.query('SELECT 1 as test');
    console.log('Query result:', result.rows);
    
    client.release();
    await pool.end();
    console.log('🔌 Disconnected');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

main();