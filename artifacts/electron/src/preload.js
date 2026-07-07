'use strict';
const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose a minimal, safe API from the main process to the renderer.
 * Never expose ipcRenderer directly — only whitelist specific channels.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath:    () => ipcRenderer.invoke('get-app-path'),
  openExternal:  (url) => ipcRenderer.invoke('open-external', url),
  platform:      process.platform,
  isElectron:    true,
});
