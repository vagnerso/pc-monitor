(async () => {
  const cpuValueEl = document.getElementById('cpu-value');
  const cpuFillEl = document.getElementById('cpu-fill');
  const memoryValueEl = document.getElementById('memory-value');
  const memoryFillEl = document.getElementById('memory-fill');
  const memoryDetailEl = document.getElementById('memory-detail');
  const diskListEl = document.getElementById('disk-list');
  const themeToggleBtn = document.getElementById('theme-toggle');

  const historyLength = window.pcMonitor.constants.HISTORY_LENGTH;
  const cpuSparkline = new Sparkline(document.getElementById('cpu-sparkline'), historyLength);
  const memorySparkline = new Sparkline(document.getElementById('memory-sparkline'), historyLength);

  let currentTheme = 'dark';

  function setGauge(fillEl, valueEl, percent) {
    const level = UiState.severityLevel(percent);
    fillEl.style.width = `${Math.min(100, percent)}%`;
    fillEl.classList.remove('level-warning', 'level-critical');
    if (level === 'warning') fillEl.classList.add('level-warning');
    if (level === 'critical') fillEl.classList.add('level-critical');
    valueEl.textContent = `${percent.toFixed(1)}%`;
  }

  function renderDisks(disks) {
    diskListEl.innerHTML = '';
    disks.forEach((disk) => {
      const row = document.createElement('div');
      row.className = 'disk-row';

      const header = document.createElement('div');
      header.className = 'disk-row-header';
      header.innerHTML = `<strong>${disk.mount}</strong><span>${disk.usedGB} / ${disk.totalGB} GB (${disk.usagePercent.toFixed(1)}%)</span>`;

      const track = document.createElement('div');
      track.className = 'gauge-track';
      const fill = document.createElement('div');
      fill.className = 'gauge-fill';
      const level = UiState.severityLevel(disk.usagePercent);
      if (level === 'warning') fill.classList.add('level-warning');
      if (level === 'critical') fill.classList.add('level-critical');
      fill.style.width = `${Math.min(100, disk.usagePercent)}%`;
      track.appendChild(fill);

      row.appendChild(header);
      row.appendChild(track);
      diskListEl.appendChild(row);
    });
  }

  function handleMetrics(metrics) {
    setGauge(cpuFillEl, cpuValueEl, metrics.cpu.usagePercent);
    cpuSparkline.push(metrics.cpu.usagePercent);

    setGauge(memoryFillEl, memoryValueEl, metrics.memory.usagePercent);
    memorySparkline.push(metrics.memory.usagePercent);
    memoryDetailEl.textContent = `${metrics.memory.usedGB} / ${metrics.memory.totalGB} GB`;

    renderDisks(metrics.disks);
  }

  async function initTheme() {
    const config = await window.pcMonitor.getConfig();
    currentTheme = config.theme === 'light' ? 'light' : 'dark';
    UiState.applyTheme(currentTheme);
  }

  themeToggleBtn.addEventListener('click', async () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    UiState.applyTheme(currentTheme);
    await window.pcMonitor.setConfig({ theme: currentTheme });
  });

  window.pcMonitor.onMetricsUpdate(handleMetrics);

  await initTheme();
})();
