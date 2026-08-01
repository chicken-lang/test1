// Test using net module to check if PostgreSQL is responding
import net from 'net';

const client = new net.Socket();
let receivedData = '';

client.connect(5432, '127.0.0.1', () => {
  console.log('✅ TCP connected!');
  
  // Send a simple PostgreSQL startup message (SSL request)
  // SSL request message: length(8) + code(80877103)
  const sslRequest = Buffer.alloc(8);
  sslRequest.writeInt32BE(8, 0);  // length
  sslRequest.writeInt32BE(80877103, 4);  // SSL code
  client.write(sslRequest);
});

client.on('data', (data) => {
  receivedData += data.toString('hex');
  console.log('📥 Received:', data.toString('hex'));
  client.destroy();
});

client.on('error', (err) => {
  console.error('❌ Error:', err.message);
});

client.setTimeout(5000, () => {
  console.error('⏰ Timeout');
  client.destroy();
});