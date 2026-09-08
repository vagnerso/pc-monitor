# PC Monitor

App desktop para Windows que monitora o uso de CPU, RAM e Disco em tempo real, construído com
Electron e JavaScript puro (sem frameworks front-end).

## Funcionalidades

- Uso de CPU em tempo real (percentual global, atualizado a cada 1.5s)
- Uso de RAM em tempo real (total, usada, livre, percentual)
- Uso de Disco por unidade (C:, D:, etc.)
- Dashboard com cards e gauges coloridos por severidade (verde/amarelo/vermelho)
- Mini-histórico gráfico (sparkline em Canvas puro) para CPU e RAM
- Ícone na bandeja do sistema com tooltip de CPU/RAM
- Tema claro/escuro, com preferência salva localmente
- Janela responsiva com modo compacto em tamanhos reduzidos

## Stack técnica

- **Electron** — shell desktop
- **JavaScript puro (ES2022+)** — sem TypeScript, sem bundler
- **HTML5 + CSS3 puro** — CSS Grid/Flexbox e Custom Properties para os temas
- **[systeminformation](https://www.npmjs.com/package/systeminformation)** — coleta de CPU/RAM/Disco no processo principal
- **electron-builder** — empacotamento do instalador Windows (NSIS)

Mais detalhes de escopo e decisões de arquitetura em
[planejamento-pc-monitor_1.md](planejamento-pc-monitor_1.md) e [DECISIONS.md](DECISIONS.md).

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm start
```

## Como gerar o instalador (Windows)

```bash
npm run dist
```

Gera `build/PC Monitor Setup <versão>.exe` (instalador NSIS). Não é assinado digitalmente — o
Windows SmartScreen pode alertar ao instalar em outra máquina.

## Estrutura do projeto

```
src/
├── main/            # Processo principal (Node): janela, tray, IPC, coleta de métricas
│   └── metrics/      # cpu.js, memory.js, disk.js (isolados, testáveis via scripts/test-metrics.js)
├── renderer/         # UI (HTML/CSS/JS puro), sem acesso direto ao Node
└── shared/           # Constantes compartilhadas
assets/icons/          # Ícones do app (placeholders — ver DECISIONS.md)
config/                # Configuração padrão (tema)
scripts/               # Scripts utilitários de desenvolvimento
```

## Segurança

Segue as práticas recomendadas do Electron: `contextIsolation: true`, `nodeIntegration: false`,
`sandbox: true`, e comunicação main ↔ renderer restrita ao `preload.js` via `contextBridge`.

## Status

Projeto em desenvolvimento (MVP). Veja o backlog e o roadmap completo em
[planejamento-pc-monitor_1.md](planejamento-pc-monitor_1.md).
