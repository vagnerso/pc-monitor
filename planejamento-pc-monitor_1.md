# Planejamento — PC Monitor (Electron)

> App desktop para Windows que monitora uso de CPU, RAM e Disco em tempo real, construído com Electron + JavaScript puro (sem frameworks front-end) e desenvolvido com apoio de IA (Claude Pro no VS Code).

---

## 1. Visão Geral

**Nome provisório:** PC Monitor (ajustar depois — sugestões: SysPulse, Vitalis, PulseDesk)

**Objetivo:** aplicativo desktop leve para Windows que exibe, em tempo real, o consumo de CPU, memória RAM e disco da máquina, com interface simples, moderna e responsiva, rodando na bandeja do sistema (system tray) e/ou em janela própria.

**Motivação do projeto:**
- Praticar Electron do zero com stack mínima (HTML/CSS/JS puro), sem a "muleta" de um framework front-end.
- Servir como estudo de caso de **desenvolvimento assistido por IA** (Claude Pro + VS Code): planejamento, geração de código, revisão e refino guiados por prompts.
- Potencial conteúdo para o canal do YouTube (documentar o processo de construção).

**Não-objetivos (fora de escopo do MVP):**
- Não é uma ferramenta de diagnóstico avançado (sem análise de processos individuais na v1).
- Não terá sincronização em nuvem, conta de usuário ou telemetria.
- Não é multiplataforma na v1 (foco 100% Windows; arquitetura deve deixar a porta aberta para macOS/Linux depois, mas sem investir esforço nisso agora).

---

## 2. Escopo Funcional

### 2.1 MVP (Versão 1.0)

| # | Funcionalidade | Detalhe |
|---|---|---|
| 1 | Uso de CPU em tempo real | Percentual global de uso, atualizado a cada 1-2s |
| 2 | Uso de RAM em tempo real | Total, usada, livre, percentual |
| 3 | Uso de Disco | Espaço total/usado/livre por unidade (C:, D:, etc.) |
| 4 | Dashboard principal | Cards/gauges com os 3 indicadores, atualização ao vivo |
| 5 | Mini-histórico gráfico | Gráfico de linha simples (ex.: últimos 60s) para CPU e RAM |
| 6 | Ícone na bandeja do sistema | Minimizar para tray, com tooltip mostrando % de CPU/RAM |
| 7 | Tema claro/escuro | Alternável, com preferência salva localmente |
| 8 | Janela responsiva | Redimensionável, com breakpoints para modo compacto |

### 2.2 Backlog (pós-MVP / v2+)

- Lista de processos que mais consomem CPU/RAM (top 5).
- Temperatura de CPU/GPU (se viável via biblioteca nativa, com fallback gracioso quando indisponível).
- Uso de rede (upload/download).
- Notificações quando uso ultrapassar limites configuráveis (ex.: RAM > 90%).
- Widget "always on top" flutuante e compacto.
- Exportar histórico de uso (CSV/JSON) — sem banco de dados, apenas arquivo local.
- Atalho global (ex.: `Ctrl+Alt+M`) para abrir/ocultar o app.
- Inicializar com o Windows (auto-start), configurável.
- Internacionalização (PT-BR / EN).

---

## 3. Stack Técnica

| Camada | Tecnologia | Observação |
|---|---|---|
| Runtime/Shell | **Electron** (versão LTS mais recente estável) | Empacota o app como executável Windows (.exe) |
| Linguagem | **JavaScript puro (ES2022+)** | Sem TypeScript, sem transpilação — reduzir complexidade de build |
| UI | **HTML5 + CSS3 puro** | Sem React/Vue; CSS Grid/Flexbox para responsividade; CSS Custom Properties para temas |
| Coleta de métricas | Módulo `os` nativo do Node.js + biblioteca **`systeminformation`** (npm) | `os` cobre RAM/CPU básicos; `systeminformation` cobre disco, múltiplos núcleos e dados mais precisos sem exigir compilação nativa complexa |
| Gráficos | Canvas API nativo (desenho manual de sparkline) *ou* biblioteca leve como **Chart.js** via `<script>` local | Decisão a validar na fase de prototipagem (ver seção 6.3) |
| Persistência local | `localStorage` (preferências de tema/config) + arquivo `config.json` via `fs` (Node) se necessário | **Sem banco de dados**, conforme definido |
| Empacotamento | **electron-builder** | Gera instalador `.exe` (NSIS) para Windows |
| Versionamento | Git + GitHub | Repositório público ou privado, com commits estruturados |
| Dev assistido por IA | **Claude Pro no VS Code** (via extensão/CLI) | Ver seção 7 |

### 3.1 Por que `systeminformation` não quebra a regra de "JS puro"?

"JavaScript puro" aqui é interpretado como **sem frameworks de UI** (React, Vue, Angular) e sem build step obrigatório (TypeScript, JSX, bundlers complexos). Bibliotecas utilitárias em JS puro que rodam no processo principal (Node.js) — como `systeminformation` — são compatíveis com essa filosofia, pois não alteram a forma como a interface é escrita. Alternativa mais "crua": usar somente `os`, `fs` e comandos nativos do Windows via `child_process` (ex.: `wmic`, `PowerShell Get-Counter`) — mais trabalho manual, mas zero dependências externas. Essa é uma decisão a validar no início do desenvolvimento (trade-off simplicidade vs. controle total).

---

## 4. Arquitetura da Aplicação

### 4.1 Processos do Electron

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│      MAIN PROCESS (Node)     │        │     RENDERER PROCESS (UI)     │
│                              │        │                                │
│ - Cria BrowserWindow         │        │ - HTML/CSS/JS puro             │
│ - Gerencia tray icon         │◄──IPC─►│ - Renderiza dashboard          │
│ - Coleta métricas (loop)     │        │ - Desenha gráficos (canvas)    │
│ - Lê/grava config.json       │        │ - Não acessa Node diretamente  │
│ - Expõe API via preload.js   │        │   (contextIsolation: true)     │
└─────────────────────────────┘        └──────────────────────────────┘
```

**Decisões de segurança (não-negociáveis mesmo em app simples):**
- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true` (quando possível)
- Comunicação main ↔ renderer exclusivamente via `preload.js` + `contextBridge`, expondo apenas as funções estritamente necessárias (ex.: `getMetrics()`, `onMetricsUpdate(callback)`).

### 4.2 Fluxo de coleta de métricas

1. O **main process** roda um `setInterval` (ex.: a cada 1000-2000ms) que chama `systeminformation` para obter CPU/RAM/Disco.
2. Os dados são enviados ao renderer via `webContents.send('metrics:update', data)`.
3. O **renderer** escuta esse evento (exposto via `preload.js`) e atualiza o DOM/gráficos.
4. Cuidado com performance: evitar `setInterval` muito agressivo (< 500ms) para não gerar overhead desnecessário; considerar debounce/throttle na atualização visual.

### 4.3 Estrutura de pastas sugerida

```
pc-monitor/
├── src/
│   ├── main/
│   │   ├── main.js              # Ponto de entrada do processo principal
│   │   ├── preload.js           # Bridge segura entre main e renderer
│   │   ├── tray.js              # Lógica do ícone na bandeja
│   │   └── metrics/
│   │       ├── cpu.js
│   │       ├── memory.js
│   │       └── disk.js
│   ├── renderer/
│   │   ├── index.html
│   │   ├── styles/
│   │   │   ├── base.css
│   │   │   ├── themes.css       # variáveis CSS para tema claro/escuro
│   │   │   └── layout.css       # grid/flex responsivo
│   │   └── scripts/
│   │       ├── app.js           # inicialização da UI
│   │       ├── charts.js        # desenho dos gráficos (canvas)
│   │       └── ui-state.js      # estado local da interface
│   └── shared/
│       └── constants.js         # constantes compartilhadas (intervalos, limites)
├── assets/
│   ├── icons/                   # ícones do app e do tray (.ico, .png)
│   └── fonts/
├── config/
│   └── default-config.json
├── build/                       # saída do electron-builder
├── package.json
├── electron-builder.yml
└── README.md
```

---

## 5. UX/UI — Diretrizes de Design

**Princípios:** simples, moderno, responsivo, fácil de usar.

- **Layout principal:** 3 cards (CPU, RAM, Disco), cada um com indicador circular ou de barra (gauge) + percentual grande e legível, seguindo padrão de dashboards de monitoramento (inspiração: Task Manager do Windows 11, Stats no macOS).
- **Paleta de cores:** neutra por padrão, com cor de destaque variando por severidade (verde < 60%, amarelo 60-85%, vermelho > 85%), consistente nos três indicadores.
- **Tipografia:** fonte do sistema (`system-ui`, `Segoe UI` no Windows) para performance e integração visual nativa.
- **Tema claro/escuro:** via CSS Custom Properties (`--bg-color`, `--text-color`, etc.) alternadas por classe no `<body>`.
- **Responsividade:** já que é uma janela desktop (não navegador), "responsivo" aqui significa se adaptar bem a redimensionamento da janela — usar CSS Grid/Flexbox com `minmax()`, `clamp()` para fontes fluidas, e um "modo compacto" quando a janela for reduzida (ex.: esconder gráficos, manter só percentuais).
- **Modo tray:** janela pequena tipo popup ancorada perto do ícone da bandeja (opcional na v1; pode começar só com janela normal + minimizar para tray).
- **Acessibilidade básica:** contraste adequado (WCAG AA), `aria-label` nos indicadores, não depender só de cor para transmitir estado (usar também texto/percentual).

---

## 6. Desenvolvimento Assistido por IA (Claude Pro + VS Code)

### 6.1 Fluxo de trabalho sugerido

1. **Planejamento por módulo:** antes de cada etapa (ex.: "coleta de CPU", "tray icon", "gráfico de histórico"), descrever para o Claude o objetivo, contrato de entrada/saída esperado e restrições (ex.: "sem dependências além de `systeminformation`").
2. **Geração incremental:** pedir um módulo por vez (ex.: `metrics/cpu.js` isolado, testável via `console.log` antes de integrar à UI).
3. **Revisão crítica:** não aceitar código gerado sem entender — pedir ao Claude para explicar trade-offs (ex.: por que `setInterval` e não `setTimeout` recursivo; por que `contextBridge` e não `nodeIntegration: true`).
4. **Refino de UX:** iterar visualmente — gerar uma versão, rodar localmente, descrever ajustes desejados (espaçamento, cores, animações) e pedir refinamento.
5. **Documentar decisões:** manter um `DECISIONS.md` ou seção no README com escolhas arquiteturais e o porquê (bom tanto para portfólio quanto para conteúdo do canal).

### 6.2 Boas práticas de prompt para este projeto

- Sempre informar o contexto da stack (Electron + JS puro, sem framework) para evitar sugestões de React/Vue.
- Pedir código comentado apenas onde a lógica não é óbvia (evitar comentário redundante).
- Pedir alternativas quando houver decisão de arquitetura relevante (ex.: "me dê 2 abordagens para desenhar o gráfico de histórico: uma com Canvas puro, outra com Chart.js, com prós/contras").
- Validar segurança do Electron explicitamente (perguntar "isso segue as boas práticas de segurança do Electron?").

### 6.3 Decisão em aberto a resolver com apoio da IA na fase de prototipagem

- Canvas manual vs. Chart.js para os gráficos de histórico (trade-off: controle total e zero dependência vs. velocidade de desenvolvimento).
- `systeminformation` vs. `os` + `wmic`/PowerShell puro (trade-off: praticidade vs. dependência externa).

---

## 7. Roadmap por Fases

| Fase | Entregas | Critério de conclusão (Definition of Done) |
|---|---|---|
| **0. Setup** | Repositório Git, `package.json`, Electron rodando com janela em branco, estrutura de pastas criada | `npm start` abre uma janela Electron vazia sem erros |
| **1. Coleta de métricas (backend)** | Módulos `cpu.js`, `memory.js`, `disk.js` funcionando isoladamente (log no terminal) | Rodar script standalone e ver CPU/RAM/Disco corretos no console, comparando com o Task Manager do Windows |
| **2. Comunicação main ↔ renderer** | `preload.js` com `contextBridge`, IPC configurado, dados chegando na UI (ainda sem estilo) | Números de CPU/RAM/Disco aparecendo e atualizando na tela a cada 1-2s |
| **3. UI/UX do dashboard** | HTML/CSS finalizados: cards, gauges, tema claro/escuro, responsividade | Interface visualmente "pronta", testada em pelo menos 3 tamanhos de janela |
| **4. Gráfico de histórico** | Sparkline/gráfico de linha para CPU e RAM (últimos 60s) | Gráfico atualiza em tempo real sem travar a UI |
| **5. System Tray** | Ícone na bandeja, tooltip com %, menu de contexto (Abrir/Sair) | Minimizar para tray funciona; tooltip atualiza |
| **6. Persistência de preferências** | Tema e configurações salvos localmente (sem DB) | Fechar e reabrir o app mantém o tema escolhido |
| **7. Empacotamento** | Build `.exe` via electron-builder, ícone customizado, instalador NSIS | Instalador gerado roda em uma máquina Windows limpa |
| **8. Polimento e testes manuais** | Checklist de testes (ver seção 9), ajustes finais de performance/UX | Checklist 100% validado |
| **9. (Opcional) Backlog v2** | Itens da seção 2.2 priorizados | Definido conforme energia/tempo disponível |

> Sugestão de ritmo: tratar cada fase como uma sessão de desenvolvimento assistido por IA (1 a poucas sessões por fase), documentando o progresso — encaixa bem como conteúdo para o canal do YouTube.

---

## 8. Empacotamento e Distribuição

- **Ferramenta:** `electron-builder`.
- **Alvo:** Windows NSIS installer (`.exe`), arquitetura x64 (avaliar necessidade de suporte ARM64 depois).
- **Ícone:** gerar `.ico` em múltiplas resoluções (16x16 até 256x256).
- **Assinatura de código:** opcional na v1 (sem certificado, o Windows SmartScreen pode alertar — mencionar isso no README para quem for instalar).
- **Auto-update:** fora do escopo do MVP; pode ser avaliado depois com `electron-updater` caso o app seja distribuído para terceiros.

---

## 9. Checklist de Testes Manuais (pré-release)

- [ ] CPU/RAM/Disco batem com os valores exibidos no Task Manager do Windows (margem de erro aceitável).
- [ ] App não trava nem gera vazamento de memória perceptível após uso prolongado (ex.: deixar aberto 1h).
- [ ] Redimensionar a janela em várias proporções sem quebra de layout.
- [ ] Tema claro/escuro persiste após reiniciar o app.
- [ ] Ícone da bandeja aparece corretamente e o menu de contexto funciona.
- [ ] Instalador `.exe` instala e desinstala corretamente em máquina limpa.
- [ ] Nenhum erro no console do DevTools em uso normal.
- [ ] `nodeIntegration` desabilitado e `contextIsolation` habilitado (checagem de segurança).

---

## 10. Riscos e Pontos de Atenção

| Risco | Mitigação |
|---|---|
| Loop de coleta de métricas travar a UI | Rodar coleta no main process, nunca no renderer; manter intervalo razoável (1-2s) |
| Dados de CPU/disco imprecisos em certas máquinas/VMs | Validar com `systeminformation` em mais de uma máquina; documentar limitações conhecidas |
| SmartScreen do Windows bloqueando instalador não assinado | Avisar o usuário final no README; avaliar certificado de assinatura futuramente |
| Overengineering para um app "simples" | Manter disciplina de escopo — revisar backlog (seção 2.2) só depois do MVP estar redondo |
| Dependência `systeminformation` ficar pesada/desatualizada | Isolar toda chamada a ela dentro de `src/main/metrics/`, facilitando troca futura sem afetar o resto do app |

---

## 11. Próximos Passos Imediatos

1. Criar repositório e rodar `npm init` + instalar `electron` e `electron-builder` como dependências de desenvolvimento.
2. Validar o "hello world" do Electron (janela em branco abrindo).
3. Prototipar a coleta de métricas isoladamente (fase 1 do roadmap) antes de tocar em UI.
4. A partir daí, seguir o roadmap da seção 7, usando o Claude Pro no VS Code como par de desenvolvimento em cada fase.
