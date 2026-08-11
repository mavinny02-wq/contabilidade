# Board de Orquestração

## Checkpoint

- branch de integração: `main`;
- versão declarada: `0.5.1`;
- commit final da onda mais recente: `9fdfe8b2af8170397d49925027c55ad7e6365760`;
- PRs da onda mais recente: `#25` a `#29`;
- validação Cloud canônica permanece histórica: `docs/operacao/VALIDACAO_CLOUD_COMPLETA_V051.md`;
- validação runtime permanece parcial: `docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md`;
- gate ativo: `GATE-VAL-001`;
- executor da prova runtime: `LOCAL_WINDOWS_MANUAL`;
- próxima onda: `NAO_SELECIONADA`;
- nenhum provider fiscal foi chamado durante as implementações.

## Onda mais recente — implementada por autorização direta

| Slot | Item | PR | Merge | Estado | Evidência |
|---:|---|---:|---|---|---|
| 1 | `EMP-IMP-001` | `#25` | `ff91c9c` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/EMP_IMP_001_IMPORTACAO_CSV.md` |
| 2 | `AUT-SHD-001` | `#26` | `68a1c15` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/AUT_SHD_001_SHUTDOWN_GRACIOSO.md` |
| 3 | `CRT-DASH-001` | `#27` | `ada8e91` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/CRT_DASH_001_DASHBOARD_GERENCIAL.md` |
| 4 | `AUD-EXP-001` | `#28` | `40abcbb` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/AUD_EXP_001_EXPORTACAO_CSV.md` |
| 5 | `DOC-ORP-001` | `#29` | `9fdfe8b` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/DOC_ORP_001_RECONCILIACAO_STORAGE.md` |

### Resultado funcional preparado

- importação CSV de empresas com modelo, validação sem gravação e resultado por linha;
- shutdown gracioso do worker com drain da execução atual e grace period do Compose;
- dashboard gerencial bounded das certidões, usando a regra autoritativa de status;
- filtros e exportação CSV da auditoria sem `detalhes_json`;
- reconciliação read-only entre documentos do PostgreSQL e arquivos do storage, sem expor paths.

## Implementações anteriores ainda aguardando runtime

Também continuam abertas as provas de:

- `SEC-AUT-001`, `PERF-CRT-001`, `OPS-BKP-001`, `OBS-WRK-001` e `SEC-DOC-001`;
- `EXP-CRT-001` e `EMP-FIL-001`.

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
9. `EMP-IMP-001`: validação, importação parcial, duplicidades, auditoria e limites;
10. `AUT-SHD-001`: worker ocioso/em execução, timeout, segundo sinal e recuperação do lease;
11. `CRT-DASH-001`: base vazia, completa, parcial, permissão e consistência com o Centro;
12. `AUD-EXP-001`: filtros, período, limite, CSV seguro e evento de exportação;
13. `DOC-ORP-001`: storage íntegro, divergências, symlink, limites e prova de zero alteração;
14. aplicação mantida em `http://localhost:8088` durante a coleta.

A execução é humana no Windows local. Depois, uma task `CODEX_CLOUD_LINUX` reconcilia o commit de
evidência. Não criar task Codex que finja acesso ao Windows, Docker Desktop ou localhost do usuário.

## Regra para a próxima onda

A próxima onda terá exatamente cinco slots independentes, mas não será selecionada antes de:

1. `GATE-VAL-001` verde para a `main` atual;
2. reconciliação dos resultados runtime;
3. atualização do baseline para o SHA comprovado;
4. revisão de ownership, migrations e conflitos.
