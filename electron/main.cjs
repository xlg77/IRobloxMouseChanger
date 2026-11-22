const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, globalShortcut } = require('electron');
const path = require('path');
let mainWindow, overlayWindow, tray;
const dev = !app.isPackaged;
function createMain() {
  mainWindow = new BrowserWindow({ width: 1120, height: 780, minWidth: 900, minHeight: 650, backgroundColor: '#0b1020', autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  if (dev) mainWindow.loadURL('http://127.0.0.1:5173/desktop.html'); else mainWindow.loadFile(path.join(__dirname, '../dist/desktop.html'));
  mainWindow.on('closed', () => mainWindow = null);
}
function createOverlay() {
  if (overlayWindow && !overlayWindow.isDestroyed()) return;
  const displays = screen.getAllDisplays();
  const bounds = displays.find(d => d.bounds.x === 0 && d.bounds.y === 0) || screen.getPrimaryDisplay();
  overlayWindow = new BrowserWindow({ x: bounds.bounds.x, y: bounds.bounds.y, width: bounds.bounds.width, height: bounds.bounds.height, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false, resizable: false, movable: false, focusable: false, skipTaskbar: true, alwaysOnTop: true, fullscreen: false, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  overlayWindow.setAlwaysOnTop(true, 'screen-saver'); overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  if (dev) overlayWindow.loadURL('http://127.0.0.1:5173/desktop.html#/overlay'); else overlayWindow.loadFile(path.join(__dirname, '../dist/desktop.html'), { hash: '/overlay' });
  overlayWindow.on('closed', () => overlayWindow = null);
  const timer = setInterval(() => { if (!overlayWindow || overlayWindow.isDestroyed()) { clearInterval(timer); return; } overlayWindow.webContents.send('cursor-position', screen.getCursorScreenPoint()); }, 16);
}
ipcMain.handle('overlay:start', () => { createOverlay(); if (mainWindow) mainWindow.hide(); return true; });
ipcMain.handle('overlay:stop', () => { if (overlayWindow) overlayWindow.close(); if (mainWindow) mainWindow.show(); return true; });
ipcMain.handle('overlay:show-menu', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } return true; });
ipcMain.handle('app:platform', () => process.platform);
app.whenReady().then(() => {
  createMain();
  const traySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="8" fill="#7898ff"/><path d="M10 7v17l5-5 4 7 3-2-4-7 7-1z" fill="white"/></svg>`;
  tray = new Tray(nativeImage.createFromDataURL('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(traySvg)));
  tray.setToolTip('IRobloxMouseChanger');
  tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Open Menu', click: () => mainWindow && mainWindow.show() }, { label: 'Stop Overlay', click: () => overlayWindow && overlayWindow.close() }, { type: 'separator' }, { label: 'Quit', click: () => app.quit() }]));
  tray.on('double-click', () => mainWindow && mainWindow.show());
  globalShortcut.register('CommandOrControl+Shift+M', () => { if (overlayWindow) overlayWindow.close(); if (mainWindow) mainWindow.show(); });
});
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => {});
app.on('activate', () => { if (!mainWindow) createMain(); else mainWindow.show(); });
