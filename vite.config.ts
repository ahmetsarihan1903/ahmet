import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function autoSyncDrawingsPlugin(): Plugin {
  return {
    name: 'auto-sync-drawings',
    configureServer(server) {
      server.middlewares.use('/api/sync-drawings', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const publicDir = path.resolve(__dirname, 'public/teknik-cizimler');
              const distDir = path.resolve(__dirname, 'dist/teknik-cizimler');
              if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
              }
              if (!fs.existsSync(distDir)) {
                fs.mkdirSync(distDir, { recursive: true });
              }

              const mapping: Record<string, string> = {
                SASE_SAG: 'makine-sase-sag.png',
                SASE_SOL: 'makine-sase-sol.png',
                CWT_SIDE_RIGHT: 'ag-yan-sag.jpg',
                CWT_SIDE_LEFT: 'ag-yan-sol.png',
                CWT_REAR: 'ag-arka.png',
                PISTON_SINGLE: 'ag-yan-sag.jpg',
                PISTON_DOUBLE: 'ag-arka.png',
              };

              const saved: string[] = [];

              if (payload.drawings) {
                for (const [key, item] of Object.entries(payload.drawings)) {
                  const filename = mapping[key];
                  const itemObj = item as { dataUrl?: string; name?: string };
                  if (filename && itemObj?.dataUrl && itemObj.dataUrl.startsWith('data:')) {
                    const matches = itemObj.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches && matches[2]) {
                      const buffer = Buffer.from(matches[2], 'base64');
                      const pubFile = path.join(publicDir, filename);
                      fs.writeFileSync(pubFile, buffer);

                      try {
                        const distFile = path.join(distDir, filename);
                        fs.writeFileSync(distFile, buffer);
                      } catch (_) {}

                      // Root public sync
                      if (key === 'SASE_SAG') {
                        fs.writeFileSync(path.resolve(__dirname, 'public/MAKINE ŞASE SAĞ.png'), buffer);
                      } else if (key === 'SASE_SOL') {
                        fs.writeFileSync(path.resolve(__dirname, 'public/MAKINE ŞASE SOL .png'), buffer);
                      }

                      saved.push(`${key} -> ${filename} (${buffer.length} bytes)`);
                    }
                  }
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, saved }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
        } else {
          res.statusCode = 404;
          res.end();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      autoSyncDrawingsPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    esbuild: {
      target: 'chrome60',
      supported: {
        'top-level-await': false,
      },
    },
    build: {
      target: ['es2015', 'chrome60', 'safari11'],
      cssTarget: 'chrome60',
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
