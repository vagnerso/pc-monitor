# CLAUDE.md

Este arquivo fornece orientação ao Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Projeto

PC Monitor — um app desktop para Windows (Electron) que exibe uso de CPU, RAM e Disco em tempo real. JavaScript puro (ES2022+), sem TypeScript, sem framework de front-end, sem bundler. A UI é HTML/CSS/JS escritos à mão. Os comentários de código e o conteúdo dos commits neste repositório estão em português (pt-BR); mantenha esse padrão ao editar arquivos existentes.

## Comandos

```bash
npm install       # instala as dependências (Node.js 18+)
npm start         # roda o app (electron .)
npm run dist      # empacota o instalador Windows (NSIS) via electron-builder, saída em build/
node scripts/test-metrics.js   # teste manual: imprime uma amostra de collectMetrics() em JSON
```

Não há suíte de testes automatizados (sem `npm test`) nem linter configurado — `scripts/test-metrics.js` é o único script de verificação, executado manualmente contra o hardware real.

## Arquitetura

Divisão padrão do Electron em dois processos, com hardening de segurança habilitado (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`). O renderer nunca acessa APIs do Node/Electron diretamente — tudo passa pelo `contextBridge` exposto em `src/main/preload.js`.

- **`src/main/main.js`** — ponto de entrada do app. Cria a `BrowserWindow`, carrega a configuração (ver abaixo), controla o loop de coleta de métricas, registra os handlers de IPC e mantém o app vivo na bandeja quando a janela é fechada (`window-all-closed` é um no-op; fechar apenas esconde a janela em vez de encerrar o app — ver o handler de `close` e a flag `app.isQuitting`).
- **`src/main/metrics/`** — coleta de métricas, isolada por fonte e testável de forma independente: `cpu.js`, `memory.js`, `disk.js`, agregadas por `index.js` em `collectMetrics()` (executa as três em paralelo via `Promise.all`). É esse módulo que `scripts/test-metrics.js` exercita diretamente, sem passar pelo Electron.
- **`src/main/tray.js`** — ícone da bandeja do sistema, menu de contexto (Abrir/Sair) e tooltip (atualizado a cada ciclo com CPU/RAM atuais).
- **`src/main/preload.js`** — a única ponte entre main e renderer. Expõe `window.pcMonitor` com `onMetricsUpdate`, `getConfig`/`setConfig` e um objeto `constants`. **O preload roda em contexto sandboxed e não pode usar `require()` para arquivos locais** — `HISTORY_LENGTH` e `SEVERITY_THRESHOLDS` são duplicados aqui manualmente a partir de `src/shared/constants.js`; mantenha os dois sincronizados ao alterar qualquer um deles.
- **`src/renderer/`** — a UI: `index.html`, `scripts/` (`app.js` lógica principal, `charts.js` sparklines em canvas, `ui-state.js`), `styles/` (`base.css`, `layout.css`, `themes.css` para tema claro/escuro via CSS Custom Properties). Só se comunica com o processo main através de `window.pcMonitor`.
- **`src/shared/constants.js`** — constantes compartilhadas (intervalo de métricas, tamanho do histórico, thresholds de severidade, chave de armazenamento do tema). Fonte da verdade; `preload.js` espelha o subconjunto que precisa.
- **Fluxo de métricas**: o processo main chama `collectMetrics()` a cada `METRICS_INTERVAL_MS` (1.5s) e envia o resultado ao renderer via o evento IPC `metrics:update` e ao tooltip da bandeja, em paralelo.
- **Configuração**: os handlers de IPC `config:get`/`config:set` persistem tema/configurações como JSON em `app.getPath('userData')/config.json`, com fallback para `config/default-config.json` caso esteja ausente/ilegível.

## Convenções de código

- Nomenclatura de variáveis, constantes, objetos, classes e métodos deve sempre usar nomes auto-explicativos. Não use nomes genéricos e difíceis de entender como `x`, `a`, `b`, `z`, `n1`, `n2`, etc.
- Essa regra vale também para abreviações técnicas comuns, mesmo em código de baixo nível (Canvas, matemática, loops): prefira `canvasContext` a `ctx`, `devicePixelRatio` a `dpr`, `valueIndex` a `i`/`idx`. Escreva a palavra completa em vez de abreviar.

## Restrições importantes

- `package.json` define `win.signAndEditExecutable: false` de forma deliberada — o pacote de assinatura de código do `electron-builder` não pode ser extraído nesta máquina sem Developer Mode ou um terminal elevado. Efeito colateral: o `.exe` empacotado usa o ícone padrão do Electron em vez de `assets/icons/icon.ico`. Ver [DECISIONS.md](DECISIONS.md) para o racional completo e como reverter.
- Escopo completo do projeto, backlog e roadmap estão em [planejamento-pc-monitor_1.md](planejamento-pc-monitor_1.md).
