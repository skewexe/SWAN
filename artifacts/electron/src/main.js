'use strict';
const { app, BrowserWindow, ipcMain, shell, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const { fork, spawn } = require('child_process');
const http = require('http');

// ─── Config ───────────────────────────────────────────────────────────────────
const IS_DEV = process.env.NODE_ENV === 'development';
const API_PORT = 3001;
const VITE_PORT = 5173;
const APP_URL = IS_DEV
  ? `http://localhost:${VITE_PORT}`
  : `http://localhost:${API_PORT}`;

let mainWindow = null;
let apiProcess = null;
let tray = null;

// ─── Start embedded API server ────────────────────────────────────────────────
function startApiServer() {
  const apiServerPath = IS_DEV
    ? path.join(__dirname, '..', '..', 'api-server', 'dist', 'index.js')
    : path.join(process.resourcesPath, 'api-server', 'dist', 'index.js');

  console.log('[Electron] Starting API server at:', apiServerPath);

  apiProcess = fork(apiServerPath, [], {
    env: {
      ...process.env,
      PORT: String(API_PORT),
      NODE_ENV: 'production',
      // SQLite for desktop mode (override DATABASE_URL in api-server if needed)
      ELECTRON_MODE: 'true',
    },
    silent: false,
  });

  apiProcess.on('error', (err) => {
    console.error('[Electron] API server error:', err);
  });

  apiProcess.on('exit', (code) => {
    console.log('[Electron] API server exited with code:', code);
  });
}

// ─── Wait for API server to be ready ─────────────────────────────────────────
function waitForServer(url, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) resolve();
        else retry();
      });
      req.on('error', retry);
      req.end();
    };
    const retry = () => {
      attempts++;
      if (attempts >= maxAttempts) return reject(new Error('Server did not start in time'));
      setTimeout(check, 1000);
    };
    check();
  });
}

// ─── Create main window ───────────────────────────────────────────────────────
function createWindow() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    title: 'Swan GMAO',
    icon: iconPath,
    backgroundColor: '#0B132B',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
    show: false,
  });

  // Show splash until app is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (IS_DEV) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.loadURL(APP_URL);

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Tray icon ────────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Ouvrir Swan GMAO', click: () => { if (mainWindow) mainWindow.show(); else createWindow(); } },
    { type: 'separator' },
    { label: 'Quitter', click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setToolTip('Swan GMAO');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { if (mainWindow) mainWindow.show(); });
}

// ─── App Menu ─────────────────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'Swan GMAO',
      submenu: [
        { label: 'À propos', role: 'about' },
        { type: 'separator' },
        { label: 'Quitter', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' },
        { role: 'redo', label: 'Rétablir' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' },
        { role: 'selectAll', label: 'Tout sélectionner' },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Recharger' },
        { role: 'forceReload', label: 'Recharger (force)' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom par défaut' },
        { role: 'zoomIn', label: 'Zoom avant' },
        { role: 'zoomOut', label: 'Zoom arrière' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' },
      ],
    },
    {
      label: 'Aide',
      submenu: [
        { label: 'Documentation GitHub', click: () => shell.openExternal('https://github.com/swan-gmao/swan-gmao') },
        { label: 'Signaler un problème', click: () => shell.openExternal('https://github.com/swan-gmao/swan-gmao/issues') },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getPath('userData'));
ipcMain.handle('open-external', (_, url) => shell.openExternal(url));

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  buildMenu();
  createTray();

  // Start API server (skip in dev — it's already running)
  if (!IS_DEV) {
    startApiServer();
    try {
      await waitForServer(`http://localhost:${API_PORT}/api/healthz`);
    } catch (err) {
      console.error('[Electron] API server failed to start:', err.message);
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (apiProcess) {
    apiProcess.kill('SIGTERM');
    apiProcess = null;
  }
});
