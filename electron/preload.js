const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveBoard: (data) => ipcRenderer.invoke('save-board', data),
  loadBoard: () => ipcRenderer.invoke('load-board'),
  onBoardLoaded: (cb) => ipcRenderer.on('board-loaded', (_e, data) => cb(data)),
});
