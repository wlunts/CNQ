// Simple static preview server with extensionless rewrite (matches production behavior)
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  let fp = path.join(ROOT, u);
  if (u.endsWith('/')) fp = path.join(fp, 'index.html');
  if (!path.extname(fp)) {
    if (fs.existsSync(fp + '.html')) fp += '.html';
    else if (fs.existsSync(path.join(fp, 'index.html'))) fp = path.join(fp, 'index.html');
  }
  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    const ext = path.extname(fp);
    const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.xml': 'application/xml' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(fs.readFileSync(fp));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.join(ROOT, '404.html')));
  }
});
server.listen(8080, () => console.log('Preview running at http://localhost:8080'));
