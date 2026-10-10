/**
 * Normalizes a local filesystem path or remote URL into a valid loadable URL for Electron/Chromium.
 * When running in Electron with the local streaming server, uses http://127.0.0.1:<port>/media?path=...
 * with full HTTP 206 Byte-Range streaming.
 */
export function getMediaUrl(filePath?: string | null): string {
  if (!filePath) return '';
  if (
    filePath.startsWith('http://') ||
    filePath.startsWith('https://') ||
    filePath.startsWith('data:') ||
    filePath.startsWith('blob:')
  ) {
    return filePath;
  }

  let cleanPath = filePath;
  if (cleanPath.startsWith('app-media://local/')) {
    cleanPath = cleanPath.slice('app-media://local/'.length);
  } else if (cleanPath.startsWith('app-media://')) {
    cleanPath = cleanPath.replace(/^app-media:\/\/(\/)?/, '');
  }
  cleanPath = decodeURIComponent(cleanPath);

  // If local media server port is available, use direct HTTP streaming!
  const port = typeof window !== 'undefined' ? (window as any).__MEDIA_SERVER_PORT__ : 0;
  if (port && port > 0) {
    return `http://127.0.0.1:${port}/media?path=${encodeURIComponent(cleanPath)}`;
  }

  const normalized = cleanPath.replace(/\\/g, '/');
  const pathWithSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `app-media://local${encodeURI(pathWithSlash)}`;
}
