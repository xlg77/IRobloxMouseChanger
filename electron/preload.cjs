const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mouseChanger', {
  startOverlay: (settings) => ipcRenderer.invoke('overlay:start', settings),
  getOverlaySettings: () => ipcRenderer.invoke('overlay:get-settings'),
  onOverlaySettings: (callback) => { const fn = (_event, value) => callback(value); ipcRenderer.on('overlay:settings', fn); return () => ipcRenderer.removeListener('overlay:settings', fn); },
  stopOverlay: () => ipcRenderer.invoke('overlay:stop'),
  restoreAndStopOverlay: () => ipcRenderer.invoke('overlay:restore-and-stop'),
  closeOverlayOnly: () => ipcRenderer.invoke('overlay:close-only'),
  showMenu: () => ipcRenderer.invoke('overlay:show-menu'),
  platform: () => ipcRenderer.invoke('app:platform'),
  applySystemCursor: (style) => ipcRenderer.invoke('system-cursor:apply', style),
  restoreSystemCursor: () => ipcRenderer.invoke('system-cursor:restore'),
  onCursorPosition: (callback) => { const fn = (_event, point) => callback(point); ipcRenderer.on('cursor-position', fn); return () => ipcRenderer.removeListener('cursor-position', fn); },
  onScreenFrame: (callback) => { const fn = (_event, frame) => callback(frame); ipcRenderer.on('screen-frame', fn); return () => ipcRenderer.removeListener('screen-frame', fn); }
});
