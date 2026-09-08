// Estado local da UI: tema atual e helpers de severidade (compartilhado entre app.js e charts.js)
const UiState = (() => {
  const thresholds = window.pcMonitor.constants.SEVERITY_THRESHOLDS;

  function severityLevel(percent) {
    if (percent >= thresholds.critical) return 'critical';
    if (percent >= thresholds.warning) return 'warning';
    return 'good';
  }

  function applyTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
    document.getElementById('icon-moon')?.toggleAttribute('hidden', theme === 'light');
    document.getElementById('icon-sun')?.toggleAttribute('hidden', theme !== 'light');
  }

  return { severityLevel, applyTheme };
})();
