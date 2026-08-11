# Backlog Administração

## Candidato v0.2.0

- providers;
- políticas;
- busca;
- auditoria;
- execuções;
- intervenções;
- Console Técnica;
- custo/configuração pública.

## Implementado após v0.5.1 — aguardando runtime

- `OBS-WRK-001`: Console Técnica classifica heartbeat recente, atrasado, expirado e ausente sem
  confundir indisponibilidade do worker com falha fiscal; evidência em
  `docs/implementacao/OBS_WRK_001_HEARTBEAT_STALE.md`;
- `AUD-EXP-001`: filtros e exportação CSV bounded dos metadados de auditoria, sem `detalhes_json` e
  com proteção contra fórmula; evidência em `docs/implementacao/AUD_EXP_001_EXPORTACAO_CSV.md`;
- `OPS-BKP-UI-001`: inventário read-only de manifestos e verificação explícita de tamanho/SHA-256,
  sem restauração ou alteração de arquivos; evidência em
  `docs/implementacao/OPS_BKP_UI_001_INVENTARIO_BACKUPS.md`;
- `ADM-CFG-001`: visão da configuração efetiva com presença segura de tokens, segredos e parâmetros
  de provider, sem serializar valores sensíveis; evidência em
  `docs/implementacao/ADM_CFG_001_CONFIGURACAO_SEGURA.md`;
- `OPS-UPD-001`: preflight read-only de manifesto de atualização, com compatibilidade de versão,
  componentes, nomes, tamanhos e formato dos hashes; evidência em
  `docs/implementacao/OPS_UPD_001_PREFLIGHT_ATUALIZACAO.md`.

## Pendências

- usuários/papéis;
- secret manager e rotação;
- histórico técnico persistente além de workers/providers;
- criação/agendamento de backup pela UI;
- execução controlada da atualização após aprovação operacional;
- edição formal da política por ambiente;
- alertas operacionais externos.
