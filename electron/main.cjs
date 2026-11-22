const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, globalShortcut } = require('electron');
const path = require('path');
let mainWindow, overlayWindow, tray;
const dev = !app.isPackaged;

const fs = require('fs');
const { spawn } = require('child_process');
const cursorIds = ['glow','swarm','ghost','target','fluid','text','splash','blob'];
function runPowerShell(script) {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const child = spawn('powershell.exe', ['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-EncodedCommand',encoded], { windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => stdout += d);
    child.stderr.on('data', d => stderr += d);
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr.trim() || stdout.trim() || 'PowerShell command failed.')));
  });
}
function psQuote(value) { return "'" + String(value).replace(/'/g, "''") + "'"; }
async function applySystemCursor(style) {
  if (process.platform !== 'win32') throw new Error('Windows에서만 시스템 커서를 변경할 수 있습니다.');
  if (!cursorIds.includes(style)) throw new Error('지원하지 않는 커서 스타일입니다.');
  const cursorPath = path.join(process.resourcesPath, 'cursors', style + '.cur');
  if (!fs.existsSync(cursorPath)) throw new Error('커서 파일을 찾을 수 없습니다: ' + cursorPath);
  const backupPath = path.join(app.getPath('userData'), 'original-system-cursors.json');
  const key = 'HKCU:\\Control Panel\\Cursors';
  const names = ['Arrow','Hand','Help','AppStarting'];
  const script = `
    $ErrorActionPreference = 'Stop'
    $key = ${psQuote(key)}
    $backup = ${psQuote(backupPath)}
    $names = @('Arrow','Hand','Help','AppStarting')
    if (-not (Test-Path -LiteralPath $backup)) {
      $props = Get-ItemProperty -LiteralPath $key
      $saved = @{}
      foreach ($name in $names) { $value = $props.PSObject.Properties[$name]; if ($null -ne $value) { $saved[$name] = [string]$value.Value } }
      $saved | ConvertTo-Json | Set-Content -LiteralPath $backup -Encoding UTF8
    }
    foreach ($name in $names) { Set-ItemProperty -LiteralPath $key -Name $name -Value ${psQuote(cursorPath)} -Type String }
    Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class CursorNative { [DllImport("user32.dll", SetLastError=true)] public static extern bool SystemParametersInfo(uint action, uint param, IntPtr value, uint flags); }'
    [void][CursorNative]::SystemParametersInfo(0x0057, 0, [IntPtr]::Zero, 0x03)
    Write-Output 'Applied'
  `;
  await runPowerShell(script);
  return { ok: true, style };
}
async function restoreSystemCursor() {
  if (process.platform !== 'win32') throw new Error('Windows에서만 시스템 커서를 복원할 수 있습니다.');
  const backupPath = path.join(app.getPath('userData'), 'original-system-cursors.json');
  const key = 'HKCU:\\Control Panel\\Cursors';
  const script = `
    $ErrorActionPreference = 'Stop'
    $key = ${psQuote(key)}
    $backup = ${psQuote(backupPath)}
    if (-not (Test-Path -LiteralPath $backup)) { throw '저장된 원래 커서 설정이 없습니다.' }
    $saved = Get-Content -LiteralPath $backup -Raw | ConvertFrom-Json
    foreach ($name in @('Arrow','Hand','Help','AppStarting')) {
      $property = $saved.PSObject.Properties[$name]
      if ($null -ne $property) { Set-ItemProperty -LiteralPath $key -Name $name -Value ([string]$property.Value) -Type String }
      else { Remove-ItemProperty -LiteralPath $key -Name $name -ErrorAction SilentlyContinue }
    }
    Remove-Item -LiteralPath $backup -Force
    Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class CursorNative { [DllImport("user32.dll", SetLastError=true)] public static extern bool SystemParametersInfo(uint action, uint param, IntPtr value, uint flags); }'
    [void][CursorNative]::SystemParametersInfo(0x0057, 0, [IntPtr]::Zero, 0x03)
    Write-Output 'Restored'
  `;
  await runPowerShell(script);
  return { ok: true };
}

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
ipcMain.handle('system-cursor:apply', async (_event, style) => applySystemCursor(style));
ipcMain.handle('system-cursor:restore', async () => restoreSystemCursor());
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
