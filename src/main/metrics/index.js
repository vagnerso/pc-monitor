const { getCpuMetrics } = require('./cpu');
const { getMemoryMetrics } = require('./memory');
const { getDiskMetrics } = require('./disk');

/**
 * Coleta as tres metricas em paralelo.
 * @returns {Promise<{cpu: object, memory: object, disks: object[], timestamp: number}>}
 */
async function collectMetrics() {
  const [cpu, memory, disks] = await Promise.all([
    getCpuMetrics(),
    getMemoryMetrics(),
    getDiskMetrics()
  ]);

  return { cpu, memory, disks, timestamp: Date.now() };
}

module.exports = { collectMetrics };
