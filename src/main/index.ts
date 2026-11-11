import dns from 'dns';
import {
  app,
  BrowserWindow,
  protocol,
  net,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  session,
  nativeImage,
} from 'electron';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { registerIpcHandlers } from './ipc-handlers';
import { quranDbService } from './services/quran-db';
import { localMediaServer } from './services/local-media-server';
import { settingsService } from './services/settings-service';

// Set application identity for OS desktop environments & taskbars
app.setName('Quran Video Studio');
if (process.platform === 'win32') {
  app.setAppUserModelId('com.quranvideo.studio');
}

// Boost V8 heap limit for large multimedia projects (e.g. 2-hour long recitation files & 4K renders)
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192');

// Prioritize IPv4 DNS lookups to prevent IPv6 ENETUNREACH and ETIMEDOUT connection stalls
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore on runtimes where not supported
}

// On macOS / packaged Electron apps, process.cwd() defaults to '/' when launched from Finder.
// Any package resolving paths against cwd (such as Remotion's getDownloadsCacheDir)
// will attempt to write to '/.remotion', causing ENOENT crashes on read-only root volumes.
// Ensure the working directory is set to a safe, writable user data directory.
try {
  if (process.cwd() === '/' || app.isPackaged) {
    const safeUserData = app.getPath('userData');
    if (!fs.existsSync(safeUserData)) {
      fs.mkdirSync(safeUserData, { recursive: true });
    }
    process.chdir(safeUserData);
  }
} catch (err) {
  console.warn('[Main] Failed to set safe working directory:', err);
}

// Register custom protocol for local media streaming
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

let mainWindow: BrowserWindow | null = null;

function createApplicationMenu(window: BrowserWindow): void {
  const isMac = process.platform === 'darwin';

  const macAppMenu: MenuItemConstructorOptions[] = isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        },
      ]
    : [];

  const fileMenu: MenuItemConstructorOptions = {
    label: 'File',
    submenu: [
      {
        label: 'Export Video...',
        accelerator: 'CmdOrCtrl+E',
        click: () => {
          window.webContents.send('menu:action', 'export-video');
        },
      },
      { type: 'separator' },
      {
        label: 'Upload Background Video...',
        click: () => {
          window.webContents.send('menu:action', 'upload-bg-video');
        },
      },
      {
        label: 'Upload Background Image...',
        click: () => {
          window.webContents.send('menu:action', 'upload-bg-image');
        },
      },
      {
        label: 'Upload Custom Recitation Audio...',
        click: () => {
          window.webContents.send('menu:action', 'upload-custom-audio');
        },
      },
      {
        label: 'Upload Recitation Video (Task 3)...',
        click: () => {
          window.webContents.send('menu:action', 'upload-recitation-video');
        },
      },
      { type: 'separator' },
      isMac ? { role: 'close' } : { role: 'quit' },
    ],
  };

  const editMenu: MenuItemConstructorOptions = {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
      { type: 'separator' },
      {
        label: 'Reset to Default',
        accelerator: 'CmdOrCtrl+Alt+R',
        click: () => {
          window.webContents.send('menu:action', 'reset-to-default');
        },
      },
    ],
  };

  const viewMenu: MenuItemConstructorOptions = {
    label: 'View',
    submenu: [
      {
        label: 'Aspect Ratio',
        submenu: [
          {
            label: '16:9 (YouTube / Desktop)',
            click: () => {
              window.webContents.send('menu:action', 'set-aspect-ratio', '16:9');
            },
          },
          {
            label: '9:16 (Shorts / Reels / TikTok)',
            click: () => {
              window.webContents.send('menu:action', 'set-aspect-ratio', '9:16');
            },
          },
          {
            label: '1:1 (Square / Social)',
            click: () => {
              window.webContents.send('menu:action', 'set-aspect-ratio', '1:1');
            },
          },
        ],
      },
      {
        label: 'Resolution',
        submenu: [
          {
            label: '1080p Full HD (Default)',
            click: () => {
              window.webContents.send('menu:action', 'set-resolution', '1080p');
            },
          },
          {
            label: '4K Ultra HD',
            click: () => {
              window.webContents.send('menu:action', 'set-resolution', '4k');
            },
          },
          {
            label: '720p HD',
            click: () => {
              window.webContents.send('menu:action', 'set-resolution', '720p');
            },
          },
        ],
      },
      {
        label: 'Frame Rate',
        submenu: [
          {
            label: '30 FPS (Cinematic)',
            click: () => {
              window.webContents.send('menu:action', 'set-fps', 30);
            },
          },
          {
            label: '60 FPS (Ultra Smooth)',
            click: () => {
              window.webContents.send('menu:action', 'set-fps', 60);
            },
          },
        ],
      },
      { type: 'separator' },
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  };

  const scriptureMenu: MenuItemConstructorOptions = {
    label: 'Scripture',
    submenu: [
      {
        label: 'Previous Surah',
        accelerator: 'CmdOrCtrl+Left',
        click: () => {
          window.webContents.send('menu:action', 'prev-surah');
        },
      },
      {
        label: 'Next Surah',
        accelerator: 'CmdOrCtrl+Right',
        click: () => {
          window.webContents.send('menu:action', 'next-surah');
        },
      },
    ],
  };

  const windowMenu: MenuItemConstructorOptions = {
    label: 'Window',
    submenu: isMac
      ? [
          { role: 'minimize' },
          { role: 'zoom' },
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' },
        ]
      : [{ role: 'minimize' }, { role: 'zoom' }, { role: 'close' }],
  };

  const helpMenu: MenuItemConstructorOptions = {
    role: 'help',
    submenu: [
      {
        label: 'About Quran Video Studio',
        click: () => {
          window.webContents.send('menu:action', 'about');
        },
      },
    ],
  };

  const template: MenuItemConstructorOptions[] = [
    ...macAppMenu,
    fileMenu,
    editMenu,
    viewMenu,
    scriptureMenu,
    windowMenu,
    helpMenu,
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function getAppIconPath(): string | undefined {
  const candidates = [
    path.join(process.resourcesPath, 'icon.png'),
    path.join(process.resourcesPath, 'build/icon.png'),
    path.join(app.getAppPath(), 'dist/icon.png'),
    path.join(app.getAppPath(), 'public/icon.png'),
    path.join(__dirname, '../../dist/icon.png'),
    path.join(__dirname, '../../public/icon.png'),
    path.join(app.getAppPath(), 'build/icon.png'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function createWindow(mediaServerPort: number): void {
  const iconPath = getAppIconPath();
  const appIcon = iconPath ? nativeImage.createFromPath(iconPath) : undefined;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Quran Video Studio',
    backgroundColor: '#090d16',
    ...(appIcon && !appIcon.isEmpty() ? { icon: appIcon } : iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      additionalArguments: [`--media-server-port=${mediaServerPort}`],
    },
  });

  if (process.platform === 'darwin' && app.dock) {
    try {
      if (appIcon && !appIcon.isEmpty()) {
        app.dock.setIcon(appIcon);
      } else if (iconPath) {
        app.dock.setIcon(iconPath);
      }
    } catch (err) {
      console.warn('[Main] Failed to set dock icon:', err);
    }
  }

  registerIpcHandlers(mainWindow);
  createApplicationMenu(mainWindow);

  // Diagnostic crash & hang telemetry for long media timelines
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[Main] Renderer process exited abnormally:', details);
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.warn('[Main] Electron renderer window became unresponsive');
  });

  // Native context menu for text fields (Cut, Copy, Paste, Undo, Redo, Select All)
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const { isEditable, selectionText, editFlags } = params;
    const contextMenu = new Menu();

    if (isEditable) {
      contextMenu.append(new MenuItem({ label: 'Undo', role: 'undo', enabled: editFlags.canUndo }));
      contextMenu.append(new MenuItem({ label: 'Redo', role: 'redo', enabled: editFlags.canRedo }));
      contextMenu.append(new MenuItem({ type: 'separator' }));
      contextMenu.append(new MenuItem({ label: 'Cut', role: 'cut', enabled: editFlags.canCut }));
      contextMenu.append(new MenuItem({ label: 'Copy', role: 'copy', enabled: editFlags.canCopy }));
      contextMenu.append(new MenuItem({ label: 'Paste', role: 'paste', enabled: editFlags.canPaste }));
      contextMenu.append(new MenuItem({ label: 'Paste and Match Style', role: 'pasteAndMatchStyle', enabled: editFlags.canPaste }));
      contextMenu.append(new MenuItem({ label: 'Delete', role: 'delete', enabled: editFlags.canDelete }));
      contextMenu.append(new MenuItem({ type: 'separator' }));
      contextMenu.append(new MenuItem({ label: 'Select All', role: 'selectAll', enabled: editFlags.canSelectAll }));
    } else if (selectionText && selectionText.trim().length > 0) {
      contextMenu.append(new MenuItem({ label: 'Copy', role: 'copy', enabled: editFlags.canCopy }));
      contextMenu.append(new MenuItem({ type: 'separator' }));
      contextMenu.append(new MenuItem({ label: 'Select All', role: 'selectAll', enabled: editFlags.canSelectAll }));
    } else {
      return;
    }

    contextMenu.popup({ window: mainWindow || undefined });
  });

  // Load dev server or production build
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // In production build, Vite outputs frontend to dist/index.html
    const appPath = app.getAppPath();
    const primaryIndex = path.join(appPath, 'dist/index.html');
    const fallbackIndex = path.join(__dirname, '../../dist/index.html');

    if (fs.existsSync(primaryIndex)) {
      mainWindow.loadFile(primaryIndex);
    } else {
      mainWindow.loadFile(fallbackIndex);
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const iconPath = getAppIconPath();
  const appIcon = iconPath ? nativeImage.createFromPath(iconPath) : undefined;
  if (process.platform === 'darwin' && app.dock) {
    try {
      if (appIcon && !appIcon.isEmpty()) {
        app.dock.setIcon(appIcon);
      } else if (iconPath) {
        app.dock.setIcon(iconPath);
      }
    } catch (err) {
      // Dock may initialize with window
    }
  }

  // Intercept and redirect root-relative file:/// requests (e.g., file:///icon-256.png, file:///reciter_images/...)
  // to their real physical location in dist/ or process.resourcesPath so production release packages never miss any assets
  const appPath = app.getAppPath();
  const distDir = fs.existsSync(path.join(appPath, 'dist'))
    ? path.join(appPath, 'dist')
    : path.join(__dirname, '../../dist');

  session.defaultSession.webRequest.onBeforeRequest({ urls: ['file:///*'] }, (details, callback) => {
    try {
      const urlObj = new URL(details.url);
      const pathname = decodeURIComponent(urlObj.pathname);

      // On Windows pathname starts with /C:/..., on Unix with /...
      let relPath = pathname;
      if (/^\/[a-zA-Z]:\//.test(pathname)) {
        relPath = pathname.slice(3);
      }
      const cleanRel = relPath.replace(/^\/+/, '');

      if (cleanRel) {
        const targetInDist = path.join(distDir, cleanRel);
        const targetInResources = path.join(process.resourcesPath, cleanRel);

        if (fs.existsSync(targetInDist)) {
          const redirected = pathToFileURL(targetInDist).toString();
          if (redirected !== details.url) {
            return callback({ redirectURL: redirected });
          }
        } else if (fs.existsSync(targetInResources)) {
          const redirected = pathToFileURL(targetInResources).toString();
          if (redirected !== details.url) {
            return callback({ redirectURL: redirected });
          }
        }
      }
    } catch (err) {
      console.warn('[Main] WebRequest asset interceptor warning:', err);
    }
    callback({});
  });

  // Start local streaming server for media with Range 206 support
  const port = await localMediaServer.start();

  // Protocol handler for app-media://
  // Forwards to localMediaServer so Chromium receives full HTTP 206 Byte-Range streaming
  protocol.handle('app-media', async (request) => {
    try {
      const parsed = new URL(request.url);
      let filePath = decodeURIComponent(parsed.pathname);
      // Strip leading hostname 'local' if present
      if (filePath.startsWith('/local/')) {
        filePath = filePath.slice('/local'.length);
      } else if (filePath.startsWith('local/')) {
        filePath = '/' + filePath.slice('local/'.length);
      }
      // On Windows or if path begins with /C:, remove the leading slash
      if (/^\/[a-zA-Z]:/.test(filePath)) {
        filePath = filePath.slice(1);
      }

      const streamUrl = localMediaServer.getMediaUrl(filePath);
      return await net.fetch(streamUrl, {
        headers: request.headers,
        method: request.method,
      });
    } catch (err) {
      console.error('Failed to load app-media:', request.url, err);
      return new Response('File not found', { status: 404 });
    }
  });

  createWindow(port);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(localMediaServer.getPort());
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  settingsService.close();
  quranDbService.closeAll();
  localMediaServer.stop();
});
