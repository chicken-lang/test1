// Test raw pg connection
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const pool = new Pool({
    connectionString: 'postgresql://jwc:jwc_dev_pwd_change_me@127.0.0.1:5432/jwc_dev?schema=public'
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected via pg!');
    
    const result = await client.query('SELECT 1 as test');
    console.log('Query:', result.rows);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

main();