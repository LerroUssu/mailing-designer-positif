const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || process.argv[2] || 8025);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (req.method === 'POST' && url.pathname === '/__save-export') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 80 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const outDir = path.join(root, 'outputs', 'brevo-export');
        fs.mkdirSync(outDir, { recursive: true });
        const zipPath = path.join(outDir, 'email-positif-brevo.zip');
        const htmlPath = path.join(outDir, 'email-positif.html');
        if (data.zipBase64) fs.writeFileSync(zipPath, Buffer.from(data.zipBase64, 'base64'));
        if (data.html) fs.writeFileSync(htmlPath, data.html, 'utf8');
        if (Array.isArray(data.files)) {
          const imagesDir = path.join(outDir, 'images');
          fs.rmSync(imagesDir, { recursive: true, force: true });
          for (const file of data.files) {
            if (!file || typeof file.name !== 'string' || typeof file.base64 !== 'string') continue;
            const cleanName = file.name.replace(/\\/g, '/');
            if (cleanName.startsWith('/') || cleanName.includes('..')) continue;
            const target = path.join(outDir, cleanName);
            if (!target.startsWith(outDir)) continue;
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, Buffer.from(file.base64, 'base64'));
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({
          ok: true,
          folder: outDir,
          zipPath,
          htmlPath,
          zipUrl: '/outputs/brevo-export/email-positif-brevo.zip',
          htmlUrl: '/outputs/brevo-export/email-positif.html',
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ ok: false, error: String(err && err.message || err) }));
      }
    });
    return;
  }
  let filePath = path.join(root, decodeURIComponent(url.pathname));
  if (url.pathname === '/') filePath = path.join(root, 'Mailings Positif Design.dc.html');
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Preview server: http://127.0.0.1:${port}/Mailings%20Positif%20Design.dc.html`);
});
