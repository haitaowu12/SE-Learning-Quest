import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

// Test/development utility only. Deployment consists solely of dist/ static files.
const root = resolve('dist');
const port = Number(process.env.PORT ?? 4173);
const prefixes = ['/SE-Learning-Quest/', '/renamed-project/', '/'];
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const prefix = prefixes.find((candidate) => pathname.startsWith(candidate));
    if (!prefix) { response.writeHead(404); response.end(); return; }
    const relative = pathname.slice(prefix.length) || 'index.html';
    const file = resolve(root, relative);
    if (!file.startsWith(root + sep) || !(await stat(file)).isFile()) throw new Error('Not found');
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Production build: http://127.0.0.1:${port}/SE-Learning-Quest/`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
