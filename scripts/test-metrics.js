const { collectMetrics } = require('../src/main/metrics');

async function main() {
  const metrics = await collectMetrics();
  console.log(JSON.stringify(metrics, null, 2));
}

main().catch((error) => {
  console.error('Falha ao coletar metricas:', error);
  process.exit(1);
});
