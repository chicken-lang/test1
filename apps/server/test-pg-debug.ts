// Debug pg connection
import pg from 'pg';

const { Client } = pg;

async function main() {
  const config = {
    user: 'jwc',
    password: '123456',
    host: '127.0.0.1',
    port: 5432,
    database: 'jwc_dev',
    ssl: false
  };
  
  console.log('Config:', JSON.stringify(config, null, 2));
  
  const client = new Client(config);
  
  client.on('error', (err) => {
    console.error('Client error:', err.message);
  });

  try {
    await client.connect();
    console.log('✅ Connected!');
    
    const result = await client.query('SELECT 1 as test');
    console.log('Query:', result.rows);
    
    await client.end();
  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    
    // Check if it's a password mismatch
    if (error.code === '28P01') {
      console.log('🔑 Password verification failed. Trying with different approach...');
    }
  }
}

main();