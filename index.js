// A simple web server
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World! Your first server is running 🚀');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
