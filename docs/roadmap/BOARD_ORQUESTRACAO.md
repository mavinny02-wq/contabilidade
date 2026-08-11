# Board de Orquestração

## Checkpoint

- branch de integração: `main`;
- versão declarada: `0.5.1`;
- commit final da onda mais recente: `0e310acecedf186bb62339e152bd7d5ee7bc0e2e`;
- PRs da onda mais recente: `#31` a `#35`;
- validação Cloud canônica permanece histórica: `docs/operacao/VALIDACAO_CLOUD_COMPLETA_V051.md`;
- validação runtime permanece parcial: `docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md`;
- gate ativo: `GATE-VAL-001`;
- executor da prova runtime: `LOCAL_WINDOWS_MANUAL`;
- próxima onda: `NAO_SELECIONADA`;
- nenhum provider fiscal foi chamado durante as implementações.

## Onda mais recente — implementada por autorização direta

| Slot | Item | PR | Merge | Estado | Evidência |
|---:|---|---:|---|---|---|
| 1 | `EMP-HIS-001` | `#31` | `fb738e6` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/EMP_HIS_001_HISTORICO_CADASTRAL.md` |
| 2 | `CRT-BULK-001` | `#32` | `9cab6c4` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/CRT_BULK_001_SOLICITACAO_LOTE.md` |
| 3 | `AUT-LIM-001` | `#33` | `fad4af7` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/AUT_LIM_001_LIMITES_SESSAO_INTERATIVA.md` |
| 4 | `OPS-BKP-UI-001` | `#34` | `a592810` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/OPS_BKP_UI_001_INVENTARIO_BACKUPS.md` |
| 5 | `DOC-RET-001` | `#35` | `0e310ac` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/DOC_RET_001_PREVIA_RETENCAO.md` |

### Resultado funcional preparado

- aba Histórico da Empresa 360 baseada na auditoria da empresa e de seus estabelecimentos;
- seleção e solicitação de até 500 acompanhamentos de certidão por lote, com idempotência por item;
- limites locais de sessões interativas e assinantes SSE, com reserva para criações concorrentes;
- inventário read-only dos backups e verificação SHA-256 explícita pela interface;
- prévia bounded de candidatos à retenção documental, sem exclusão ou alteração do storage.

## Implementações anteriores ainda aguardando runtime

Também continuam abertas as provas de:

- primeira onda: `SEC-AUT-001`, `PERF-CRT-001`, `OPS-BKP-001`, `OBS-WRK-001` e `SEC-DOC-001`;
- adicionais: `EXP-CRT-001` e `EMP-FIL-001`;
- onda anterior: `EMP-IMP-001`, `AUT-SHD-001`, `CRT-DASH-001`, `AUD-EXP-001` e `DOC-ORP-001`.

Todos os itens integrados permanecem `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`. A prova Cloud da
PR `#12` não classifica a `main` atual, porque backend, frontend e worker foram modificados depois
daquela execução.

## Provas necessárias para fechar o gate

Todas devem partir da `main` atual ou de descendente reconciliado:

1. `mvn -B clean verify` com JDK 21 e registry funcional;
2. frontend `npm ci`, i18n, typecheck e build com Node 22.12+;
3. worker `npm ci`, typecheck e build com Node 22.12+;
4. Compose efetivo para `dev` e `onpremise`;
5. execução do `START_CONTABILIDADE.bat dev` sem chamadas fiscais externas;
6. imagens artifact-only, PostgreSQL, `postgres-bootstrap`, Keycloak/Liquibase e Flyway V1–V8;
7. endpoints técnicos, proxies e smoke UI;
8. provas focadas das implementações anteriores;
9. `EMP-HIS-001`: isolamento entre empresas, paginação, ator e ausência de `detalhes_json`;
10. `CRT-BULK-001`: lotes, duplicidades, idempotência e resultado parcialmente aceito;
11. `AUT-LIM-001`: concorrência de criação, limite SSE, liberação e health agregado;
12. `OPS-BKP-UI-001`: manifesto válido/inválido, tamanho, hash, symlink e mount read-only;
13. `DOC-RET-001`: critérios isolados/combinados, filtro, resultado parcial e zero alteração;
14. aplicação mantida em `http://localhost:8088` durante a coleta.

A execução é humana no Windows local. Depois, uma task `CODEX_CLOUD_LINUX` reconcilia o commit de
evidência. Não criar task Codex que finja acesso ao Windows, Docker Desktop ou localhost do usuário.

## Regra para a próxima onda

A próxima onda terá exatamente cinco slots independentes, mas não será selecionada antes de:

1. `GATE-VAL-001` verde para a `main` atual;
2. reconciliação dos resultados runtime;
3. atualização do baseline para o SHA comprovado;
4. revisão de ownership, migrations e conflitos.
