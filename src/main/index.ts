import { app, BrowserWindow, protocol, net, Menu, MenuItemConstructorOptions } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { registerIpcHandlers } from './ipc-handlers';
import { quranDbService } from './services/quran-db';

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

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Quran Video Studio',
    backgroundColor: '#090d16',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  registerIpcHandlers(mainWindow);
  createApplicationMenu(mainWindow);

  // Load dev server or production build
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Protocol handler for app-media://
  // Allows loading local disk files like video/audio/images cleanly into Remotion Player and img/video elements
  protocol.handle('app-media', async (request) => {
    try {
      const parsed = new URL(request.url);
      let filePath = decodeURIComponent(parsed.pathname);
      // On Windows or if path begins with /C:, remove the leading slash
      if (/^\/[a-zA-Z]:/.test(filePath)) {
        filePath = filePath.slice(1);
      }
      const fileUrl = pathToFileURL(filePath).toString();
      const response = await net.fetch(fileUrl);
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (err) {
      console.error('Failed to load app-media:', request.url, err);
      return new Response('File not found', { status: 404 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  quranDbService.closeAll();
});
