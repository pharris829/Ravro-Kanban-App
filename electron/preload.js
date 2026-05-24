const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  board: {
    load: () => ipcRenderer.invoke('board:load'),
    save: (data) => ipcRenderer.invoke('board:save', data),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (data) => ipcRenderer.invoke('settings:set', data),
  },
  ai: {
    complete: (payload) => ipcRenderer.invoke('ai:complete', payload),
  },
});
