# Board de Orquestração

## Checkpoint

- branch de integração: `main`;
- versão declarada: `0.5.1`;
- commit final da onda mais recente: `d7e50e55ad7c2ee0dafbf48736d22507470e0c92`;
- PRs da onda mais recente: `#37` a `#41`;
- migration mais recente: `V9__empresa_grupos_tags.sql`;
- validação Cloud canônica permanece histórica: `docs/operacao/VALIDACAO_CLOUD_COMPLETA_V051.md`;
- validação runtime permanece parcial: `docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md`;
- gate ativo: `GATE-VAL-001`;
- executor da prova runtime: `LOCAL_WINDOWS_MANUAL`;
- próxima onda: `NAO_SELECIONADA`;
- nenhum provider fiscal foi chamado durante as implementações.

## Onda mais recente — implementada por autorização direta

| Slot | Item | PR | Merge | Estado | Evidência |
|---:|---|---:|---|---|---|
| 1 | `EMP-GRP-001` | `#37` | `97fbc00` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/EMP_GRP_001_GRUPOS_TAGS.md` |
| 2 | `CRT-CAL-001` | `#38` | `5d35b19` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/CRT_CAL_001_AGENDA_VENCIMENTOS.md` |
| 3 | `OBS-PRV-001` | `#39` | `3294aa9` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/OBS_PRV_001_HISTORICO_PROVEDORES.md` |
| 4 | `ADM-CFG-001` | `#40` | `b719f0b` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/ADM_CFG_001_CONFIGURACAO_SEGURA.md` |
| 5 | `DOC-PRE-001` | `#41` | `d7e50e5` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/DOC_PRE_001_PREVIEW_SEGURO.md` |

### Resultado funcional preparado

- grupos e tags separados do cadastro fiscal, pesquisáveis e persistidos pela V9;
- agenda bounded de vencimentos de certidões, com período, empresa, status e prazo;
- histórico operacional de providers com status, duração e custo separado por moeda;
- configuração efetiva exibida sem serialização de tokens, segredos ou URLs completas;
- preview de PDF/PNG/JPEG após recálculo de tamanho e SHA-256.

## Implementações anteriores ainda aguardando runtime

Também continuam abertas as provas de todas as PRs funcionais anteriores, incluindo:

- segurança, scheduler, backup, heartbeat e integridade: `#14` a `#18`;
- exportação e filiais: `#20` e `#23`;
- importação, shutdown, dashboard, auditoria e storage: `#25` a `#29`;
- histórico, bulk, limites, backup UI e retenção: `#31` a `#35`.

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
6. imagens artifact-only, PostgreSQL, `postgres-bootstrap`, Keycloak/Liquibase e Flyway V1–V9;
7. endpoints técnicos, proxies e smoke UI;
8. provas focadas de todas as implementações anteriores;
9. `EMP-GRP-001`: V9, busca, deduplicação, limites e isolamento do cadastro fiscal;
10. `CRT-CAL-001`: períodos, filtro, status e resultado parcial;
11. `OBS-PRV-001`: status, moedas, duração, taxa e ausência de payload/segredo;
12. `ADM-CFG-001`: alertas corretos e nenhuma exposição de valor sensível;
13. `DOC-PRE-001`: formatos permitidos, integridade, headers, Blob URL e auditoria;
14. aplicação mantida em `http://localhost:8088` durante a coleta.

A execução é humana no Windows local. Depois, uma task `CODEX_CLOUD_LINUX` reconcilia o commit de
evidência. Não criar task Codex que finja acesso ao Windows, Docker Desktop ou localhost do usuário.

## Regra para a próxima onda

A próxima onda terá exatamente cinco slots independentes, mas não será selecionada antes de:

1. `GATE-VAL-001` verde para a `main` atual;
2. reconciliação dos resultados runtime;
3. atualização do baseline para o SHA comprovado;
4. revisão de ownership, migrations e conflitos.
