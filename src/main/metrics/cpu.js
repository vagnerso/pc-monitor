const systemInfo = require('systeminformation');

/**
 * Le a carga atual de CPU.
 * @returns {Promise<{usagePercent: number, cores: number[]}>}
 */
async function getCpuMetrics() {
  const cpuLoadInfo = await systemInfo.currentLoad();

  return {
    usagePercent: Math.round(cpuLoadInfo.currentLoad * 10) / 10,
    cores: cpuLoadInfo.cpus.map((core) => Math.round(core.load * 10) / 10)
  };
}

module.exports = { getCpuMetrics };
