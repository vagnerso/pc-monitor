(async () => {
  const cpuValueElement = document.getElementById('cpu-value');
  const cpuFillElement = document.getElementById('cpu-fill');
  const memoryValueElement = document.getElementById('memory-value');
  const memoryFillElement = document.getElementById('memory-fill');
  const memoryDetailElement = document.getElementById('memory-detail');
  const diskListElement = document.getElementById('disk-list');
  const themeToggleButton = document.getElementById('theme-toggle');

  const historyLength = window.pcMonitor.constants.HISTORY_LENGTH;
  const cpuSparkline = new Sparkline(document.getElementById('cpu-sparkline'), historyLength);
  const memorySparkline = new Sparkline(document.getElementById('memory-sparkline'), historyLength);

  let currentTheme = 'dark';

  function setGauge(fillElement, valueElement, usagePercent) {
    const severityLevel = UiState.severityLevel(usagePercent);
    fillElement.style.width = `${Math.min(100, usagePercent)}%`;
    fillElement.classList.remove('level-warning', 'level-critical');
    if (severityLevel === 'warning') fillElement.classList.add('level-warning');
    if (severityLevel === 'critical') fillElement.classList.add('level-critical');
    valueElement.textContent = `${usagePercent.toFixed(1)}%`;
  }

  function renderDisks(disks) {
    diskListElement.innerHTML = '';
    disks.forEach((disk) => {
      const severityLevel = UiState.severityLevel(disk.usagePercent);

      const row = document.createElement('div');
      row.className = 'disk-row';

      const pieCanvas = document.createElement('canvas');
      pieCanvas.className = 'disk-pie';
      pieCanvas.setAttribute('aria-hidden', 'true');
      row.appendChild(pieCanvas);

      const info = document.createElement('div');
      info.className = 'disk-row-info';

      const header = document.createElement('div');
      header.className = 'disk-row-header';
      header.innerHTML = `<strong>${disk.mount}</strong><span>${disk.usedGB} / ${disk.totalGB} GB (${disk.usagePercent.toFixed(1)}%)</span>`;
      info.appendChild(header);

      const legend = document.createElement('div');
      legend.className = 'disk-pie-legend';
      legend.innerHTML = `
        <span class="legend-item"><span class="legend-dot level-${severityLevel}"></span>Usado (${disk.usedGB} GB)</span>
        <span class="legend-item"><span class="legend-dot level-free"></span>Livre (${disk.freeGB} GB)</span>
      `;
      info.appendChild(legend);

      row.appendChild(info);
      diskListElement.appendChild(row);

      drawDiskUsagePie(pieCanvas, disk.usagePercent, severityLevel);
    });
  }

  function handleMetrics(metrics) {
    setGauge(cpuFillElement, cpuValueElement, metrics.cpu.usagePercent);
    cpuSparkline.push(metrics.cpu.usagePercent);

    setGauge(memoryFillElement, memoryValueElement, metrics.memory.usagePercent);
    memorySparkline.push(metrics.memory.usagePercent);
    memoryDetailElement.textContent = `${metrics.memory.usedGB} / ${metrics.memory.totalGB} GB`;

    renderDisks(metrics.disks);
  }

  async function initTheme() {
    const config = await window.pcMonitor.getConfig();
    currentTheme = config.theme === 'light' ? 'light' : 'dark';
    UiState.applyTheme(currentTheme);
  }

  themeToggleButton.addEventListener('click', async () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    UiState.applyTheme(currentTheme);
    await window.pcMonitor.setConfig({ theme: currentTheme });
  });

  window.pcMonitor.onMetricsUpdate(handleMetrics);

  await initTheme();
})();
