# Decisões de Arquitetura

## Empacotamento Windows sem `signAndEditExecutable` (Fase 7)

**Contexto:** `electron-builder` baixa o pacote `winCodeSign` (assinatura de código) mesmo em builds
exclusivas para Windows, pois `signtool.exe` fica dentro dele. Esse pacote contém symlinks de macOS
que o Windows só consegue extrair com "Developer Mode" ativado ou terminal elevado (admin) — nenhum
dos dois disponível neste ambiente de desenvolvimento.

**Decisão:** desabilitado `win.signAndEditExecutable: false` em `package.json`. Isso pula tanto a
assinatura (que não temos certificado para fazer mesmo, ver seção 8 do planejamento) quanto a etapa
de `rcedit` que grava o ícone/metadados (versão, descrição, empresa) diretamente nos bytes do
`PC Monitor.exe`.

**Efeito colateral conhecido:** o `.exe` empacotado fica com o ícone padrão do Electron (não o nosso
`assets/icons/icon.ico`) até essa flag ser revertida. O instalador NSIS em si já foi validado
funcionando (instalação e desinstalação silenciosas testadas com sucesso).

**Como reverter quando possível:** ativar o Developer Mode do Windows (Config. > Privacidade e
segurança > Para desenvolvedores) ou rodar `npm run dist` num terminal "Executar como
administrador", depois remover a linha `signAndEditExecutable: false`.
