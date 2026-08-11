# Board de Orquestração

## Checkpoint

- branch de integração: `main`;
- versão atual: `0.5.1`;
- evidência cloud integrada: `docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md`;
- merge da validação cloud: PR `#9`, commit `beabe35bd6aef2dc4e64515a1b2255963629218d`;
- classificação da evidência cloud: `BLOQUEADO_POR_AMBIENTE` para runtime completo;
- lockfiles versionados: comprovado;
- frontend `npm ci`/i18n/typecheck/build no Codex Cloud: comprovado;
- worker `npm ci`/typecheck/build e startup sem crash de PDF.js no Codex Cloud: comprovado após correção;
- gate ativo: `GATE-VAL-001`;
- validação ainda obrigatória: Windows + JDK 21 + Node 22.12+ + Maven + Docker Desktop;
- slots oficiais selecionados: zero enquanto o gate não estiver verde;
- próxima onda: cinco candidatos independentes mantidos como `PREVIEW`.

## Provas ainda necessárias para fechar o gate

Todas devem partir do mesmo commit atualizado de `main`:

1. `mvn -B clean verify` verde no Windows com JDK 21 e acesso ao repositório Maven;
2. frontend e worker verdes no Windows com Node 22.12 ou superior;
3. `docker compose config` verde para `dev` e `onpremise`;
4. execução do `START_CONTABILIDADE.bat dev` sem chamadas fiscais externas;
5. `postgres` saudável e `postgres-bootstrap` finalizado com código `0`;
6. Keycloak/Liquibase e Flyway V1–V7 validados por `scripts/validate-database-state.bat dev`;
7. backend, worker e frontend saudáveis;
8. endpoints técnicos e smoke da interface aprovados;
9. parser PDF comprovado com amostra sintética local, sem documento fiscal real;
10. aplicação deixada rodando em `http://localhost:8088` durante a prova.

## Regra de promoção

Os prompts `PREVIEW_SLOT_*` só podem ser promovidos a slots oficiais depois que a evidência local for
anexada ao relatório runtime e a classificação geral mudar para `VERDE`. A validação cloud da PR #9
resolveu blockers de lockfile/build frontend/worker, mas não substitui a prova Windows/Docker.

## Candidatos da onda após o gate

1. `SEC-AUT-001` — anti-replay de tickets de sessão;
2. `PERF-CRT-001` — consultas limitadas no scheduler de certidões;
3. `OPS-BKP-001` — manifesto/verificação de backup;
4. `OBS-WRK-001` — heartbeat vencido na Console Técnica;
5. `SEC-DOC-001` — verificação de integridade do storage.

Os cinco candidatos não possuem dependência entre si e devem partir do mesmo futuro commit verde.
