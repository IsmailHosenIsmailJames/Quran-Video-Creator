/**
 * Normalizes a local filesystem path or remote URL into a valid loadable URL for Electron/Chromium.
 * Uses the custom protocol `app-media://local/<path>` which has a valid host ('local') and standard pathname.
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
  if (filePath.startsWith('app-media://')) {
    if (filePath.startsWith('app-media://local/')) {
      return filePath;
    }
    const raw = filePath.replace(/^app-media:\/\/(\/)?/, '');
    const decoded = decodeURIComponent(raw);
    const normalized = decoded.replace(/\\/g, '/');
    const pathWithSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `app-media://local${encodeURI(pathWithSlash)}`;
  }

  const normalized = filePath.replace(/\\/g, '/');
  const pathWithSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `app-media://local${encodeURI(pathWithSlash)}`;
}
