const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const { collectMetrics } = require('./metrics');
const { createTray, destroyTray, updateTrayTooltip } = require('./tray');
const { METRICS_INTERVAL_MS } = require('../shared/constants');

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');
const DEFAULT_CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'default-config.json');

let mainWindow = null;
let metricsTimer = null;

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    try {
      return JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8'));
    } catch {
      return { theme: 'dark' };
    }
  }
}

function saveConfig(config) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    minWidth: 300,
    minHeight: 420,
    backgroundColor: '#1e1e1e',
    icon: path.join(__dirname, '..', '..', 'assets', 'icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startMetricsLoop() {
  const tick = async () => {
    try {
      const metrics = await collectMetrics();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('metrics:update', metrics);
      }
      updateTrayTooltip(metrics);
    } catch (error) {
      console.error('Erro ao coletar metricas:', error);
    }
  };

  tick();
  metricsTimer = setInterval(tick, METRICS_INTERVAL_MS);
}

function stopMetricsLoop() {
  if (metricsTimer) {
    clearInterval(metricsTimer);
    metricsTimer = null;
  }
}

ipcMain.handle('config:get', () => loadConfig());
ipcMain.handle('config:set', (_event, config) => {
  saveConfig(config);
  return config;
});

app.whenReady().then(() => {
  createWindow();
  createTray(() => {
    mainWindow?.show();
    mainWindow?.focus();
  }, () => {
    app.isQuitting = true;
    app.quit();
  });
  startMetricsLoop();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('window-all-closed', () => {
  // Mantem o app rodando na bandeja mesmo com a janela fechada (Windows).
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopMetricsLoop();
  destroyTray();
});
