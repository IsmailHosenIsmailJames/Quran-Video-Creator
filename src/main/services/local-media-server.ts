import http from 'http';
import fs from 'fs';
import path from 'path';

class LocalMediaServer {
  private server: http.Server | null = null;
  private port: number = 0;

  public async start(): Promise<number> {
    if (this.server && this.port > 0) {
      return this.port;
    }

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        // Universal CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        try {
          const parsedUrl = new URL(req.url || '', `http://127.0.0.1:${this.port}`);
          let filePath = parsedUrl.searchParams.get('path');

          if (!filePath && parsedUrl.pathname.startsWith('/media/')) {
            filePath = decodeURIComponent(parsedUrl.pathname.slice('/media/'.length));
          }

          if (!filePath) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing media path parameter');
            return;
          }

          filePath = decodeURIComponent(filePath);

          if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`File not found: ${filePath}`);
            return;
          }

          const stat = fs.statSync(filePath);
          const fileSize = stat.size;
          const ext = path.extname(filePath).toLowerCase();

          // MIME resolution
          let contentType = 'application/octet-stream';
          if (ext === '.mp4') contentType = 'video/mp4';
          else if (ext === '.webm') contentType = 'video/webm';
          else if (ext === '.mov') contentType = 'video/quicktime';
          else if (ext === '.mp3') contentType = 'audio/mpeg';
          else if (ext === '.wav') contentType = 'audio/wav';
          else if (ext === '.aac') contentType = 'audio/aac';
          else if (ext === '.ogg') contentType = 'audio/ogg';
          else if (ext === '.png') contentType = 'image/png';
          else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
          else if (ext === '.webp') contentType = 'image/webp';
          else if (ext === '.svg') contentType = 'image/svg+xml';

          if (req.method === 'HEAD') {
            res.writeHead(200, {
              'Content-Length': fileSize,
              'Accept-Ranges': 'bytes',
              'Content-Type': contentType,
            });
            res.end();
            return;
          }

          // Handle HTTP 206 Partial Content for video seeking
          const range = req.headers.range;
          if (range && range.startsWith('bytes=')) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10) || 0;
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (start >= fileSize || end >= fileSize) {
              res.writeHead(416, {
                'Content-Range': `bytes */${fileSize}`,
              });
              res.end();
              return;
            }

            const chunkSize = end - start + 1;
            const stream = fs.createReadStream(filePath, { start, end });
            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunkSize,
              'Content-Type': contentType,
            });
            stream.pipe(res);
          } else {
            res.writeHead(200, {
              'Content-Length': fileSize,
              'Accept-Ranges': 'bytes',
              'Content-Type': contentType,
            });
            fs.createReadStream(filePath).pipe(res);
          }
        } catch (err: any) {
          console.error('[LocalMediaServer] Error serving file:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(err?.message || 'Internal server error');
        }
      });

      // Listen on localhost with OS-assigned free port (port 0)
      this.server.listen(0, '127.0.0.1', () => {
        const addr = this.server?.address();
        if (addr && typeof addr === 'object') {
          this.port = addr.port;
          console.log(`📡 Local media streaming server running at http://127.0.0.1:${this.port}`);
          resolve(this.port);
        } else {
          reject(new Error('Failed to obtain local media server port'));
        }
      });

      this.server.on('error', (err) => {
        reject(err);
      });
    });
  }

  public getMediaUrl(absoluteFilePath?: string | null): string {
    if (!absoluteFilePath) return '';
    if (
      absoluteFilePath.startsWith('http://') ||
      absoluteFilePath.startsWith('https://') ||
      absoluteFilePath.startsWith('data:') ||
      absoluteFilePath.startsWith('blob:')
    ) {
      return absoluteFilePath;
    }

    let cleanPath = absoluteFilePath;
    if (cleanPath.startsWith('app-media://local/')) {
      cleanPath = cleanPath.slice('app-media://local/'.length);
    } else if (cleanPath.startsWith('app-media://')) {
      cleanPath = cleanPath.replace(/^app-media:\/\/(\/)?/, '');
    }

    cleanPath = decodeURIComponent(cleanPath);

    return `http://127.0.0.1:${this.port}/media?path=${encodeURIComponent(cleanPath)}`;
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.port = 0;
    }
  }
}

export const localMediaServer = new LocalMediaServer();
