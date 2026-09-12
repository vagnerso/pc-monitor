const systemInfo = require('systeminformation');

const BYTES_PER_GB = 1024 ** 3;

/**
 * Le o uso atual de memoria RAM.
 * @returns {Promise<{totalGB: number, usedGB: number, freeGB: number, usagePercent: number}>}
 */
async function getMemoryMetrics() {
  const memoryInfo = await systemInfo.mem();

  // "used" da systeminformation ja desconta buffers/cache (mais proximo do Task Manager)
  const usedBytes = memoryInfo.active || memoryInfo.used;
  const totalBytes = memoryInfo.total;
  const freeBytes = totalBytes - usedBytes;

  return {
    totalGB: Math.round((totalBytes / BYTES_PER_GB) * 10) / 10,
    usedGB: Math.round((usedBytes / BYTES_PER_GB) * 10) / 10,
    freeGB: Math.round((freeBytes / BYTES_PER_GB) * 10) / 10,
    usagePercent: Math.round((usedBytes / totalBytes) * 1000) / 10
  };
}

module.exports = { getMemoryMetrics };
