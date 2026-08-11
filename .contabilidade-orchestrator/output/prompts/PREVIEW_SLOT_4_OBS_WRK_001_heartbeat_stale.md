# ARQUIVADO — OBS-WRK-001

> Não executar novamente. Implementação integrada pela PR `#17`.

- **ITEM:** `OBS-WRK-001`
- **STATUS:** `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
- **BRANCH:** `feat/obs-wrk-001-heartbeat-stale`
- **PR:** `#17`
- **MERGE:** `6d2d96453611c10ed55673a3077a65467c208fd6`
- **EVIDÊNCIA:** `docs/implementacao/OBS_WRK_001_HEARTBEAT_STALE.md`

## Resultado implementado

- heartbeat recente, atrasado, expirado, futuro e ausente;
- estados saudável, degradado e indisponível;
- limiares configuráveis;
- motivo seguro, versão, idade e último heartbeat;
- card agregado e lista bounded na Console Técnica;
- ausência do worker separada de falha fiscal.

## Estado de validação

Permanecem pendentes Maven, i18n/typecheck/build frontend e prova runtime dos diferentes limiares e
da ausência total de heartbeat.
