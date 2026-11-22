const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mouseChanger', {
  startOverlay: () => ipcRenderer.invoke('overlay:start'),
  stopOverlay: () => ipcRenderer.invoke('overlay:stop'),
  restoreAndStopOverlay: () => ipcRenderer.invoke('overlay:restore-and-stop'),
  closeOverlayOnly: () => ipcRenderer.invoke('overlay:close-only'),
  showMenu: () => ipcRenderer.invoke('overlay:show-menu'),
  platform: () => ipcRenderer.invoke('app:platform'),
  applySystemCursor: (style) => ipcRenderer.invoke('system-cursor:apply', style),
  restoreSystemCursor: () => ipcRenderer.invoke('system-cursor:restore'),
  onCursorPosition: (callback) => { const fn = (_event, point) => callback(point); ipcRenderer.on('cursor-position', fn); return () => ipcRenderer.removeListener('cursor-position', fn); }
});
