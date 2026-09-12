const systemInfo = require('systeminformation');

const BYTES_PER_GB = 1024 ** 3;

/**
 * Le o uso de disco por unidade montada.
 * @returns {Promise<Array<{fs: string, mount: string, totalGB: number, usedGB: number, freeGB: number, usagePercent: number}>>}
 */
async function getDiskMetrics() {
  const diskLayout = await systemInfo.fsSize();

  return diskLayout.map((disk) => ({
    fs: disk.fs,
    mount: disk.mount,
    totalGB: Math.round((disk.size / BYTES_PER_GB) * 10) / 10,
    usedGB: Math.round((disk.used / BYTES_PER_GB) * 10) / 10,
    freeGB: Math.round(((disk.size - disk.used) / BYTES_PER_GB) * 10) / 10,
    usagePercent: Math.round(disk.use * 10) / 10
  }));
}

module.exports = { getDiskMetrics };
