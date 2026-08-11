# Board de Orquestração

## Checkpoint

- branch de integração: `main`;
- versão declarada: `0.5.1`;
- commit final da onda mais recente: `8d7357bf70a77bf6e265f4c50aed6453510a93d3`;
- PRs da onda mais recente: `#43` a `#47`;
- migrations mais recentes: `V10__empresa_responsaveis_modulo.sql`, `V11__faturas_provedor.sql` e `V12__worker_heartbeat_historico.sql`;
- validação Cloud canônica permanece histórica: `docs/operacao/VALIDACAO_CLOUD_COMPLETA_V051.md`;
- validação runtime permanece parcial: `docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md`;
- gate ativo: `GATE-VAL-001`;
- executor da prova runtime: `LOCAL_WINDOWS_MANUAL`;
- próxima onda: `NAO_SELECIONADA`;
- nenhum provider fiscal foi chamado durante as implementações.

## Onda mais recente — implementada por autorização direta

| Slot | Item | PR | Merge | Estado | Evidência |
|---:|---|---:|---|---|---|
| 1 | `EMP-RSP-001` | `#43` | `2b13fcf` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/EMP_RSP_001_RESPONSAVEIS_MODULO.md` |
| 2 | `CRT-FAT-001` | `#44` | `d47ece6` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/CRT_FAT_001_RECONCILIACAO_FATURAS.md` |
| 3 | `AUT-TEL-001` | `#45` | `7c553d7` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/AUT_TEL_001_HISTORICO_HEARTBEATS.md` |
| 4 | `OPS-UPD-001` | `#46` | `99f72a7` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/OPS_UPD_001_PREFLIGHT_ATUALIZACAO.md` |
| 5 | `DOC-MET-001` | `#47` | `8d7357b` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/DOC_MET_001_EDICAO_METADADOS.md` |

### Resultado funcional preparado

- contatos operacionais separados por empresa e módulo, com unicidade e auditoria sem PII;
- reconciliação de faturas com custos estimados por provider, competência e moeda;
- histórico amostrado de heartbeats, evitando uma linha por polling;
- preflight read-only de manifesto de atualização, sem download ou execução;
- correção de tipo, emissão e validade sem substituir a evidência documental.

## Implementações anteriores ainda aguardando runtime

Também continuam abertas as provas de todas as PRs funcionais anteriores, incluindo:

- segurança, scheduler, backup, heartbeat e integridade: `#14` a `#18`;
- exportação e filiais: `#20` e `#23`;
- importação, shutdown, dashboard, auditoria e storage: `#25` a `#29`;
- histórico, bulk, limites, backup UI e retenção: `#31` a `#35`;
- grupos, agenda, providers, configuração e preview: `#37` a `#41`.

Todos os itens integrados permanecem `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`. A prova Cloud da
PR `#12` não classifica a `main` atual, porque backend, frontend, worker e migrations foram
modificados depois daquela execução.

## Provas necessárias para fechar o gate

Todas devem partir da `main` atual ou de descendente reconciliado:

1. `mvn -B clean verify` com JDK 21 e registry funcional;
2. frontend `npm ci`, i18n, typecheck e build com Node 22.12+;
3. worker `npm ci`, typecheck e build com Node 22.12+;
4. Compose efetivo para `dev` e `onpremise`;
5. execução do `START_CONTABILIDADE.bat dev` sem chamadas fiscais externas;
6. imagens artifact-only, PostgreSQL, `postgres-bootstrap`, Keycloak/Liquibase e Flyway V1–V12;
7. endpoints técnicos, proxies e smoke UI;
8. provas focadas de todas as implementações anteriores;
9. `EMP-RSP-001`: V10, CRUD por módulo, unicidade, isolamento e ausência de PII na auditoria;
10. `CRT-FAT-001`: V11, moedas, tolerância, idempotência e separação por provider;
11. `AUT-TEL-001`: V12, amostragem temporal, mudança de estado/versão e múltiplos workers;
12. `OPS-UPD-001`: manifesto válido/inválido, compatibilidade, traversal, tamanhos, hashes e ausência de execução;
13. `DOC-MET-001`: datas, tipo, permissões e imutabilidade de arquivo/hash/MIME/origem/storage;
14. aplicação mantida em `http://localhost:8088` durante a coleta.

A execução é humana no Windows local. Depois, uma task `CODEX_CLOUD_LINUX` reconcilia o commit de
evidência. Não criar task Codex que finja acesso ao Windows, Docker Desktop ou localhost do usuário.

## Regra para a próxima onda

A próxima onda terá exatamente cinco slots independentes, mas não será selecionada antes de:

1. `GATE-VAL-001` verde para a `main` atual;
2. reconciliação dos resultados runtime;
3. atualização do baseline para o SHA comprovado;
4. revisão de ownership, migrations e conflitos.
