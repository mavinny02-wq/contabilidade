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
  com proteção contra fórmula; evidência em `docs/implementacao/AUD_EXP_001_EXPORTACAO_CSV.md`.

## Pendências

- usuários/papéis;
- secrets;
- histórico técnico;
- backup na UI;
- atualização controlada;
- política por ambiente;
- alertas operacionais externos.
