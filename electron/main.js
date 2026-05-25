const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { callAI } = require('./ai');

const isDev = process.env.NODE_ENV === 'development';
const getBoardPath    = () => path.join(app.getPath('userData'), 'board.json');
const getSettingsPath = () => path.join(app.getPath('userData'), 'settings.json');

// Resolves the icon path for both dev and packaged builds
function iconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, '..', 'build', 'icon.ico');
}

// ── Persistence helpers ──────────────────────────────────────────
function readJSON(filePath) {
  try {
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : null;
  } catch { return null; }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Window ───────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0f0f0f',
    icon: iconPath(),
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  // Required for Windows taskbar pinning and jump lists
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.ravro.kanban');
  }
  createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ── Board IPC ────────────────────────────────────────────────────
ipcMain.handle('board:load', () => readJSON(getBoardPath()));
ipcMain.handle('board:save', (_e, data) => { writeJSON(getBoardPath(), data); return { ok: true }; });

// ── Settings IPC ─────────────────────────────────────────────────
ipcMain.handle('settings:get', () => readJSON(getSettingsPath()) || {});
ipcMain.handle('settings:set', (_e, data) => { writeJSON(getSettingsPath(), data); return { ok: true }; });

// ── File IPC ─────────────────────────────────────────────────────
ipcMain.handle('dialog:open-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
  return canceled ? [] : filePaths;
});
ipcMain.handle('shell:open-path', (_e, filePath) => shell.openPath(filePath));

// ── AI IPC ───────────────────────────────────────────────────────
ipcMain.handle('ai:complete', async (_e, { messages, systemPrompt }) => {
  const settings = readJSON(getSettingsPath()) || {};
  try {
    const text = await callAI(settings, messages, systemPrompt);
    return { ok: true, text };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
