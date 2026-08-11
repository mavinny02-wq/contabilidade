# Board de Orquestração

## Checkpoint

- branch de integração: `main`;
- versão declarada: `0.5.1`;
- commit com a onda implementada: `b50fd182e4e4e1d0c1573bcb9e43fd8ff368cf01`;
- commit após `EXP-CRT-001`: `99df51e9b37195692e35c6651fafb10905f83b32`;
- commit após `EMP-FIL-001`: `4468f98f4b57a3a5d233f5ae890447ac6a73002a`;
- PRs implementadas diretamente: `#14` a `#18`, `#20` e `#23`;
- validação Cloud histórica: `docs/operacao/VALIDACAO_CLOUD_COMPLETA_V051.md`;
- validação runtime histórica/parcial: `docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md`;
- classificação Cloud histórica: `CLOUD_AMARELO` na baseline anterior às implementações atuais;
- gate ativo: `GATE-VAL-001`;
- executor da prova runtime: `LOCAL_WINDOWS_MANUAL`;
- slots oficiais selecionados para uma nova onda: zero;
- próxima onda: não selecionada enquanto a main atual não estiver verde.

## Itens implementados por autorização direta

| Item | PR | Merge | Estado | Evidência |
|---|---:|---|---|---|
| `SEC-AUT-001` | `#14` | `d02fd5c` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/SEC_AUT_001_ANTI_REPLAY_SESSAO.md` |
| `PERF-CRT-001` | `#15` | `1b0827c` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/PERF_CRT_001_CONSULTAS_LIMITADAS.md` |
| `OPS-BKP-001` | `#16` | `c432a00` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/OPS_BKP_001_MANIFESTO_BACKUP.md` |
| `OBS-WRK-001` | `#17` | `6d2d964` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/OBS_WRK_001_HEARTBEAT_STALE.md` |
| `SEC-DOC-001` | `#18` | `b50fd18` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/SEC_DOC_001_INTEGRIDADE_DOWNLOAD.md` |
| `EXP-CRT-001` | `#20` | `99df51e` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/EXP_CRT_001_EXPORTACAO_CSV.md` |
| `EMP-FIL-001` | `#23` | `4468f98` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/EMP_FIL_001_EDICAO_FILIAL.md` |

### Resultado funcional preparado

- ticket interativo com `jti` de uso único, grant HttpOnly e migration V8;
- scheduler de certidões com lotes bounded, cursores rotativos e transações por item;
- backups com manifesto, tamanho, SHA-256 e verificadores não destrutivos;
- Console Técnica com idade e classificação dos heartbeats do worker;
- download documental bloqueado quando tamanho ou SHA-256 divergem;
- Centro de Certidões com exportação CSV filtrável, bounded, auditada e protegida contra fórmula;
- Empresa 360 com edição e ativação/inativação individual de filial, CNPJ imutável e sincronização não destrutiva dos acompanhamentos.

Os prompts arquivados não devem ser executados novamente.

## Efeito sobre as provas anteriores

A PR `#12` continua válida como evidência histórica de lockfiles, PDF.js, frontend/worker e análises
estáticas naquele commit. Entretanto, backend, worker e frontend foram alterados depois dela. Por
isso a main atual exige novo ciclo de build e runtime; o resultado histórico não pode ser promovido
automaticamente para o commit `4468f98f`.

## Provas necessárias para fechar o gate

Todas devem partir da main atual ou de descendente reconciliado:

1. `mvn -B clean verify` com JDK 21 e registry funcional;
2. frontend `npm ci`, i18n, typecheck e build com Node 22.12+;
3. worker `npm ci`, typecheck e build com Node 22.12+;
4. `docker compose config` efetivo para `dev` e `onpremise`;
5. execução do `START_CONTABILIDADE.bat dev` sem chamadas fiscais externas;
6. imagens artifact-only reais construídas e verificadas;
7. PostgreSQL saudável e `postgres-bootstrap` finalizado com código `0`;
8. Keycloak/Liquibase e Flyway V1–V8 validados;
9. backend, worker e frontend saudáveis, sem restart loop;
10. endpoints técnicos, proxies e smoke da interface aprovados;
11. anti-replay: troca inicial, replay 409, grant, rotação e restart;
12. scheduler: lotes maiores que os limites, avanço e wrap dos cursores;
13. backup: geração real, PowerShell, verificação cruzada e adulteração rejeitada;
14. heartbeat: estados recente, atrasado, expirado e ausência total;
15. documento: download íntegro e adulteração do storage recusada com auditoria persistida;
16. exportação CSV: filtros, UTF-8, proteção contra fórmula, limite excedido e auditoria;
17. filial: edição, inativação, reativação, CNPJ imutável e sincronização de certidões por UF;
18. aplicação deixada rodando em `http://localhost:8088` durante a prova.

A coleta da prova é humana no Windows local. Depois, uma task `CODEX_CLOUD_LINUX` reconcilia o commit
de evidência. Não criar task Codex que finja acesso a `cmd.exe`, WSL, Docker Desktop ou ao localhost
do usuário.

## Regra para a próxima onda

A próxima onda terá exatamente cinco slots independentes, mas ainda não foi selecionada. Seleção,
ownership e prompts só podem ser produzidos após:

1. gate runtime verde para a main atual;
2. reconciliação dos itens implementados acima;
3. atualização do baseline para o SHA verde;
4. revisão de conflitos de ownership e migrations.
