const { app, BrowserWindow, Menu, shell } = require('electron');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
};

let mainWindow = null;
let localServer = null;

// Single instance lock: if app is already running, focus existing window
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function getDistDir() {
  const localDist = path.join(__dirname, 'dist');
  if (fs.existsSync(localDist)) {
    return localDist;
  }
  return path.resolve(__dirname, '..', 'dist');
}

function fetchHttpsWithRedirects(targetUrl, depth = 0) {
  return new Promise((resolve, reject) => {
    if (depth > 6) {
      reject(new Error('Too many redirects'));
      return;
    }
    const client = targetUrl.startsWith('http://') ? http : https;
    const req = client.get(targetUrl, (upstream) => {
      if (
        upstream.statusCode >= 300 &&
        upstream.statusCode < 400 &&
        upstream.headers.location
      ) {
        const nextUrl = new URL(upstream.headers.location, targetUrl).toString();
        upstream.resume();
        fetchHttpsWithRedirects(nextUrl, depth + 1).then(resolve).catch(reject);
        return;
      }
      let data = '';
      upstream.setEncoding('utf8');
      upstream.on('data', (chunk) => {
        data += chunk;
      });
      upstream.on('end', () => {
        resolve({ statusCode: upstream.statusCode || 200, body: data });
      });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy(new Error('Timeout'));
    });
  });
}

function startLocalStaticServer(distDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
        if (reqUrl.pathname === '/api/fetch-sheet') {
          const targetUrl = reqUrl.searchParams.get('url');
          if (
            !targetUrl ||
            (!targetUrl.startsWith('https://docs.google.com/') &&
              !targetUrl.startsWith('https://drive.google.com/'))
          ) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Gecersiz URL');
            return;
          }
          try {
            const result = await fetchHttpsWithRedirects(targetUrl);
            res.writeHead(result.statusCode, {
              'Content-Type': 'text/csv; charset=utf-8',
              'Cache-Control': 'no-cache',
            });
            res.end(result.body);
          } catch (fetchErr) {
            res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(fetchErr?.message || 'Baglanti hatasi');
          }
          return;
        }

        const reqPathRaw = reqUrl.pathname;
        let reqPath = '/';
        try {
          reqPath = decodeURIComponent(reqPathRaw);
        } catch {
          reqPath = reqPathRaw;
        }

        if (reqPath === '/' || reqPath === '') {
          reqPath = '/index.html';
        }

        // Prevent directory traversal
        const safeRelPath = path.normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, '');
        let filePath = path.join(distDir, safeRelPath);

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(distDir, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, content) => {
          if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Dosya bulunamadi');
            return;
          }
          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache',
          });
          res.end(content);
        });
      } catch (err) {
        res.writeHead(500);
        res.end('Sunucu hatasi');
      }
    });

    // Prefer fixed port 45123 so localStorage stays consistent across restarts
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        server.listen(0, '127.0.0.1', () => {
          const addr = server.address();
          resolve({ server, port: addr.port });
        });
      } else {
        reject(err);
      }
    });

    server.listen(45123, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
  });
}

function createWindow(port) {
  const iconPng = path.join(__dirname, 'icon.png');
  const iconIco = path.join(__dirname, 'icon.ico');
  const windowIcon = fs.existsSync(iconIco)
    ? iconIco
    : fs.existsSync(iconPng)
    ? iconPng
    : undefined;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 620,
    title: 'Beta Asansör - Kalite Kontrol ve Saha Yönetim Sistemi',
    icon: windowIcon,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  Menu.setApplicationMenu(null);

  // Handle popups (allow Google Auth / Firebase Auth popups; open Drive links in browser)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isAuthPopup =
      url.startsWith('https://accounts.google.com') ||
      url.includes('firebaseapp.com') ||
      url.startsWith(`http://localhost:${port}`);

    if (isAuthPopup) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 520,
          height: 680,
          autoHideMenuBar: true,
        },
      };
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Enable Ctrl+R / F5 refresh and F11 fullscreen
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
      mainWindow.reload();
      event.preventDefault();
    } else if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadURL(`http://localhost:${port}/?winapp=1`);
}

app.whenReady().then(async () => {
  try {
    const distDir = getDistDir();
    const { server, port } = await startLocalStaticServer(distDir);
    localServer = server;
    createWindow(port);
  } catch (err) {
    console.error('Uygulama baslatilamadi:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (localServer) {
    try {
      localServer.close();
    } catch {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
