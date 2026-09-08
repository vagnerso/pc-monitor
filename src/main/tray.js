const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray = null;

function createTray(onOpen, onQuit) {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'icons', 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip('PC Monitor');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir', click: onOpen },
    { label: 'Sair', click: onQuit }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('double-click', onOpen);

  return tray;
}

function updateTrayTooltip(metrics) {
  if (!tray) return;
  const { cpu, memory } = metrics;
  tray.setToolTip(`PC Monitor\nCPU: ${cpu.usagePercent}%  |  RAM: ${memory.usagePercent}%`);
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = { createTray, updateTrayTooltip, destroyTray };
