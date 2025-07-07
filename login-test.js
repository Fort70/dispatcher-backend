const http = require('http');

const data = JSON.stringify({
  email: 'nitroflat@gmail.com',
  password: 'MyTest123!'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/users/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => console.log('Body:', body));
});

req.on('error', (err) => console.error('Error:', err));
req.write(data);
req.end();
