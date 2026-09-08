const si = require('systeminformation');

const BYTES_PER_GB = 1024 ** 3;

/**
 * Le o uso atual de memoria RAM.
 * @returns {Promise<{totalGB: number, usedGB: number, freeGB: number, usagePercent: number}>}
 */
async function getMemoryMetrics() {
  const mem = await si.mem();

  // "used" da systeminformation ja desconta buffers/cache (mais proximo do Task Manager)
  const used = mem.active || mem.used;
  const total = mem.total;
  const free = total - used;

  return {
    totalGB: Math.round((total / BYTES_PER_GB) * 10) / 10,
    usedGB: Math.round((used / BYTES_PER_GB) * 10) / 10,
    freeGB: Math.round((free / BYTES_PER_GB) * 10) / 10,
    usagePercent: Math.round((used / total) * 1000) / 10
  };
}

module.exports = { getMemoryMetrics };
