const { contextBridge, ipcRenderer } = require('electron');

// Preload roda em contexto sandboxed: so pode usar 'require' para modulos do
// Electron/Node embutidos, nao para arquivos locais. Por isso os valores abaixo
// sao copiados manualmente de src/shared/constants.js (mantenha em sincronia).
const HISTORY_LENGTH = 40;
const SEVERITY_THRESHOLDS = { warning: 60, critical: 85 };

contextBridge.exposeInMainWorld('pcMonitor', {
  onMetricsUpdate: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('metrics:update', listener);
    return () => ipcRenderer.removeListener('metrics:update', listener);
  },
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config) => ipcRenderer.invoke('config:set', config),
  constants: {
    HISTORY_LENGTH,
    SEVERITY_THRESHOLDS
  }
});
