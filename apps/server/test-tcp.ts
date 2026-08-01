// Test basic TCP connection to PostgreSQL
import net from 'net';

const client = new net.Socket();

client.connect(5432, '127.0.0.1', () => {
  console.log('✅ TCP connection to PostgreSQL successful!');
  client.destroy();
});

client.on('error', (err) => {
  console.error('❌ TCP connection failed:', err.message);
});

client.setTimeout(5000, () => {
  console.error('⏰ Connection timeout');
  client.destroy();
});