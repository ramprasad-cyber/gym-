const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const frontendDir = path.resolve(__dirname, '..');
const dbPath = path.join(__dirname, 'database.json');

function readDb() {
  if (!fs.existsSync(dbPath)) {
    const initialData = {
      members: [
        { id: 1, name: 'Ava', email: 'ava@example.com', plan: 'Premium' }
      ],
      classes: [
        { id: 1, name: 'Yoga', time: '06:00' }
      ]
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    return initialData;
  }

  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml'
  }[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (requestUrl.pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (requestUrl.pathname === '/api/members') {
    if (req.method === 'GET') {
      const db = readDb();
      sendJson(res, 200, db.members);
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const db = readDb();
          const member = {
            id: Date.now(),
            name: data.name || 'New Member',
            email: data.email || 'member@example.com',
            plan: data.plan || 'Basic'
          };

          db.members.push(member);
          writeDb(db);
          sendJson(res, 201, member);
        } catch (error) {
          sendJson(res, 400, { error: 'Invalid JSON body' });
        }
      });
      return;
    }
  }

  if (requestUrl.pathname === '/api/classes') {
    const db = readDb();
    sendJson(res, 200, db.classes);
    return;
  }

  const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const safePath = path.normalize(pathname).replace(/^\/+/, '');
  const filePath = path.join(frontendDir, safePath);

  if (!filePath.startsWith(frontendDir)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveStaticFile(res, filePath);
  } else {
    serveStaticFile(res, path.join(frontendDir, 'index.html'));
  }
});

server.listen(PORT, () => {
  console.log(`Gym backend running at http://localhost:${PORT}`);
});
