const si = require('systeminformation');

/**
 * Le a carga atual de CPU.
 * @returns {Promise<{usagePercent: number, cores: number[]}>}
 */
async function getCpuMetrics() {
  const load = await si.currentLoad();

  return {
    usagePercent: Math.round(load.currentLoad * 10) / 10,
    cores: load.cpus.map((core) => Math.round(core.load * 10) / 10)
  };
}

module.exports = { getCpuMetrics };
