const { collectMetrics } = require('../src/main/metrics');

async function main() {
  const metrics = await collectMetrics();
  console.log(JSON.stringify(metrics, null, 2));
}

main().catch((err) => {
  console.error('Falha ao coletar metricas:', err);
  process.exit(1);
});
