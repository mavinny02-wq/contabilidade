# Validação runtime completa — v0.5.1

**Item:** `VAL-RUNTIME-V051-001`  
**Execução:** 2026-08-10, entre 23:57 UTC e 2026-08-11 00:01 UTC  
**Classificação final:** `BLOQUEADO_POR_AMBIENTE`

## Resumo executivo

A versão declarada é `0.5.1`. A validação ocorreu em um container Linux, e não no workspace Windows solicitado. O frontend foi aprovado em instalação bloqueada por lockfile, i18n, typecheck e build. O automation worker apresentou um blocker TypeScript determinístico nos fallbacks de globais do PDF.js; a tipagem foi corrigida com diff mínimo e `npm ci`, typecheck e build foram aprovados na reexecução. O processo do worker chegou a iniciar sem `ReferenceError` de `DOMMatrix`, `ImageData` ou `Path2D`; as falhas posteriores foram as esperadas pela ausência deliberada de backend e browser no runner.

A prova integral ficou bloqueada porque Docker/Compose, Windows/`cmd.exe`, WSL e `.env` não existem neste ambiente, o Node disponível (`20.20.2`) não satisfaz o requisito do projeto, e o Maven Central respondeu HTTP 403 para o parent do Spring Boot. Portanto PostgreSQL, bootstrap, Keycloak, backend, worker e frontend **não foram iniciados**, schemas e endpoints não puderam ser comprovados, a interface não pôde ser percorrida e a stack não ficou rodando. Não há alegação de runtime simulado nem de aplicação disponível em `http://localhost:8088`.

## Baseline Git

| Campo | Evidência |
|---|---|
| Branch inicial | `work` |
| HEAD inicial | `a2e921f86ef5b836ec74d0065cb43fded80cda85` |
| Upstream inicial | ausente (`fatal: no upstream configured for branch 'work'`) |
| Árvore inicial | limpa (`git status --short` sem saída) |
| Remoto `origin` | ausente; `git fetch origin` falhou com exit code 128 |
| Atualização de `main` | não executável sem remoto; nenhum baseline foi inventado |
| Branch de trabalho | `validation/runtime-completa-v051` |
| Versão | `VERSION` contém `0.5.1` |

## Ambiente e toolchain

| Comando/verificação | Resultado real | Exit code |
|---|---|---:|
| `uname -a` | Linux x86_64, kernel `6.18.35` | 0 |
| `git --version` | `2.43.0` | 0 |
| `java -version` | OpenJDK `21.0.2` | 0 |
| `javac -version` | `21.0.2` | 0 |
| `mvn --version` | Maven `3.9.10`, usando Java `21.0.2` | 0 |
| `node --version` | `v20.20.2`; incompatível com `>=22.12.0` | 0 |
| `npm --version` | `11.4.2` | 0 |
| `docker --version` | comando ausente | 127 |
| `docker compose version` | comando ausente | 127 |
| `wsl --version` | comando ausente | 127 |
| `df -h .` | 29 GiB livres, 53% utilizado | 0 |
| portas 5432/8080/8088/3001 | nenhuma escuta encontrada | 0 |
| `.env` | ausente; conteúdo não foi criado nem exibido | — |
| `APP_SECURITY_ENABLED` efetivo | não verificável sem `.env`/Compose | — |
| lockfiles | presentes em frontend e worker | — |

## Arquivos lidos

Foram lidos integralmente: `AGENTS.md`, `README.md`, `VERSION`, `CHANGELOG.md`, `START_CONTABILIDADE.bat`, `compose.yaml`, `compose.dev.yaml`, `compose.onpremise.yaml`, `scripts/start-compose-sequential.bat`, `scripts/validate-database-state.bat`, `scripts/validar.ps1`, `docs/INDICE_DOCUMENTACAO_ATIVA.md`, `docs/GOVERNANCA_DOCUMENTACAO.md`, `docs/operacao/START_CONTABILIDADE_BAT.md`, `docs/operacao/VALIDACAO_SCHEMAS_POSTGRES_KEYCLOAK.md`, os relatórios ativos `VALIDACAO_V020.md` a `VALIDACAO_V050.md`, migrations Flyway V1–V7, `backend/pom.xml`, ambos os `package.json`, ambos os `package-lock.json` por uso de `npm ci`, e os realms `realm-contabilidade-dev.json` e `realm-contabilidade.json`. Código e configuração executável foram tratados como autoridade sobre relatórios antigos.

## Alterações realizadas

| Arquivo | Causa | Correção mínima | Revalidação |
|---|---|---|---|
| `automation-worker/src/PdfTextExtractor.ts` | A interseção de `typeof globalThis` com propriedades `unknown` preservava os construtores DOM da lib, tornando os fallbacks incompatíveis e causando TS2739/TS2741 nas linhas de atribuição. | `PdfRuntimeGlobals` passou a ser um tipo isolado e o cast de `globalThis` passou por `unknown`; sem mudança do comportamento de runtime. | `npm ci`, `npm run typecheck` e `npm run build`: exit code 0. Startup controlado chegou à escuta e registrou os fluxos sem `ReferenceError`. |
| `docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md` | Entrega obrigatória de evidência. | Registro curado desta execução, sem segredos. | `git diff --check`. |

Nenhuma dependência, migration, configuração de segurança ou dado foi alterado.

## Builds e testes

### Backend

`mvn -B clean verify` foi executado antes e depois da correção. Ambos os ciclos falharam com exit code 1 antes da compilação: o Maven Central respondeu HTTP 403 ao parent `org.springframework.boot:spring-boot-starter-parent:3.5.16`. Isso é `BLOQUEADO_POR_AMBIENTE`, não evidência de defeito no código. Não existem fontes em `backend/src/test`; nenhuma cobertura foi inventada. JAR executável e migrations dentro do JAR não puderam ser comprovados.

### Frontend

Último ciclo completo:

| Comando | Resultado | Exit code |
|---|---|---:|
| `npm ci` | 132 pacotes instalados; aviso de engine pelo Node 20 | 0 |
| `npm run locale:validate` | bundle pt-BR válido; 42 arquivos e 86 entradas dinâmicas | 0 |
| `npm run typecheck` | zero erro TypeScript | 0 |
| `npm run build` | Vite: 111 módulos; `dist/index.html` e assets produzidos | 0 |

Não há script `test` no manifest. O lockfile não foi modificado. O `tsconfig.app.tsbuildinfo` rastreado e regenerado pelo build foi restaurado byte a byte a partir do HEAD, pois não representa mudança de produto.

### Automation worker

No primeiro ciclo, `npm ci` passou, mas typecheck e build falharam com exit code 2 (TS2739/TS2741). Após a correção, o último ciclo teve exit code 0 para `npm ci`, typecheck e build. Não há script `test`.

O startup controlado `timeout 5s env WORKER_TOKEN=... BACKEND_URL=http://127.0.0.1:65534 POLL_INTERVAL_MS=60000 node dist/index.js` terminou por timeout (124), após comprovar que o processo escutou em 3001 e carregou os quatro fluxos. Não houve crash de import/PDF.js nem `ReferenceError` de globais. `ECONNREFUSED` no heartbeat/aquisição e browser Playwright ausente são limitações deliberadas do harness; nenhuma chamada fiscal foi feita.

## Docker Compose

Os comandos obrigatórios foram tentados:

- `docker compose --env-file .env -f compose.yaml -f compose.dev.yaml config`: exit code 127;
- `docker compose --env-file .env -f compose.yaml -f compose.onpremise.yaml config`: exit code 127.

Docker não existe no runner e `.env` está ausente. Por inspeção, `compose.yaml` declara `postgres`, `postgres-bootstrap`, `keycloak`, `backend`, `automation-worker` e `frontend`, rede `contabilidade`, volume `postgres_data`, storage de documentos, healthchecks e dependências. A expansão efetiva, imagens artifact-only e runtime não foram validados.

## Estado final dos containers

| Serviço | Estado comprovado |
|---|---|
| postgres | `BLOQUEADO_POR_AMBIENTE` — não iniciado |
| postgres-bootstrap | `BLOQUEADO_POR_AMBIENTE` — não iniciado |
| keycloak | `BLOQUEADO_POR_AMBIENTE` — não iniciado |
| backend | `BLOQUEADO_POR_AMBIENTE` — não iniciado |
| automation-worker | `BLOQUEADO_POR_AMBIENTE` — não iniciado em Compose |
| frontend | `BLOQUEADO_POR_AMBIENTE` — não iniciado |

`docker compose ... ps -a`, `images` e `logs` não puderam ser executados (Docker ausente, exit 127). Nenhuma stack duplicada ou volume foi criado, parado ou removido.

## PostgreSQL e postgres-bootstrap

Não houve banco disponível. O bootstrap one-shot e a mensagem informativa de volume existente não puderam ser observados. Nenhuma query de escrita, criação manual ou remoção de volume foi executada.

## Keycloak e Liquibase

Sem Docker/PostgreSQL, `databasechangelog`, `databasechangeloglock`, `migration_model`, lock Liquibase e contagem de changesets ficaram `BLOQUEADO_POR_AMBIENTE`. Nenhuma tabela Liquibase foi criada manualmente.

## Backend e Flyway

Foram encontradas as migrations V1 a V7, em sequência e incluídas na árvore de resources. Sem backend/banco, `flyway_schema_history`, sucesso, pendências, tabelas principais, ApplicationName e execução de V6/V7 não puderam ser consultados. Nenhuma migration foi editada e `flyway repair` não foi executado.

## Automation worker

O build corrigido está verde. O teste controlado provou carregamento compatível dos parsers e fallbacks de PDF.js no Node disponível. A ausência de browser foi registrada pelo próprio worker sem derrubar o processo; nenhum portal foi aberto. A saúde em container, heartbeat recente real e token interno permaneceram sem prova por falta da stack.

## Frontend

Build e i18n estão verdes. O bundle foi produzido localmente. Nginx, proxy, runtime config, responsividade e renderização real não foram executados porque Docker e navegador contra a aplicação não estavam disponíveis.

## Endpoints técnicos

Todos foram tentados com `curl --max-time 3`; sem stack, retornaram HTTP `000` e exit code 7:

| URL | HTTP | Resultado |
|---|---:|---|
| `http://localhost:8088/healthz` | 000 | conexão recusada |
| `http://localhost:8080/actuator/health/liveness` | 000 | conexão recusada |
| `http://localhost:8080/actuator/health/readiness` | 000 | conexão recusada |
| `http://localhost:3001/health` | 000 | conexão recusada |
| `http://localhost:8088/auth/realms/contabilidade/.well-known/openid-configuration` | 000 | conexão recusada |
| `http://localhost:8088/` | 000 | conexão recusada |
| `http://localhost:8088/api` | 000 | conexão recusada |

Proxy `/auth`, `/api` e `/automation` não foram comprovados.

## Validação funcional da interface

`NÃO EXECUTADA — BLOQUEADO_POR_AMBIENTE`. Como `http://localhost:8088` não estava disponível, não foi possível usar navegador/Playwright para dashboard, Empresas/Empresa 360, Documentos, Execuções, Intervenções, Notificações, Integrações, Auditoria, Console Técnica, busca, URLs diretas/refresh, layout, console, respostas 500, estados vazios, permissões, modais e i18n renderizado. Nenhum screenshot foi capturado para não apresentar uma interface simulada.

## Segurança e observabilidade

Por inspeção, modo dev sobrepõe `APP_SECURITY_ENABLED` e `APP_AUTH_ENABLED` para `false`, enquanto on-premise mantém o fluxo autenticado; os providers externos persistidos por V2/V5–V7 permanecem desabilitados e o provider manual é o único habilitado. O runtime de token interno, CORS, autorização de documentos, correlationId, Console Técnica, logs e heartbeat não pôde ser comprovado. Nenhum segredo, token, cookie, `.env`, payload fiscal ou credencial foi exibido no relatório. Nenhuma chamada Serpro/governamental ocorreu.

## Dados de validação criados

`NÃO EXECUTADO POR SEGURANÇA`: não foi possível comprovar banco descartável, ausência de dados reais e providers efetivos sem runtime. Nenhum CNPJ ou documento foi criado.

## Comandos executados e exit codes

Além das leituras e inventários, foram executados:

| Comando | Exit code final |
|---|---:|
| `git fetch origin` | 128 (remoto ausente) |
| `git switch -c validation/runtime-completa-v051` | 0 |
| `mvn -B clean verify` (dois ciclos) | 1 |
| `npm ci` (frontend, dois ciclos) | 0 |
| `npm run locale:validate` (dois ciclos) | 0 |
| `npm run typecheck` (frontend, dois ciclos) | 0 |
| `npm run build` (frontend, dois ciclos) | 0 |
| `npm ci` (worker, ciclos inicial/correção/final) | 0 |
| `npm run typecheck` (worker inicial) | 2 |
| `npm run build` (worker inicial) | 2 |
| `npm run typecheck` (worker após correção e final) | 0 |
| `npm run build` (worker após correção e final) | 0 |
| startup controlado do worker | 124 (encerrado por timeout intencional) |
| ambos os `docker compose ... config` | 127 |
| `cmd.exe /d /c "(echo.)|call START_CONTABILIDADE.bat dev"` | 127 |
| `cmd.exe /d /c call scripts\\validate-database-state.bat dev` | 127 |
| curls dos endpoints | 7 cada |

Os exit codes acima são reais; nenhum comando indisponível foi marcado como aprovado.

## Falhas encontradas e correções

1. **Blocker de produto corrigido:** TS2739/TS2741 nos fallbacks de `PdfTextExtractor.ts`. Causa, diff e revalidação estão em “Alterações realizadas”.
2. **Maven bloqueado pelo ambiente:** HTTP 403 ao resolver o parent Spring Boot. Nenhuma versão foi trocada e nenhuma configuração de repositório foi adulterada.
3. **Runtime bloqueado pelo ambiente:** Linux sem Docker, Compose, `cmd.exe`, WSL e `.env`.
4. **Toolchain parcial:** Node 20 abaixo do requisito Node 22.12+ (e do requisito 22.13+ informado pelo `pdfjs-dist`). Os builds npm passaram, mas isso não substitui a prova na engine suportada.

## Operações deliberadamente não executadas

Não foram executados providers externos, CAPTCHA, chamadas pagas, uso de dados reais, upload fiscal, CRUD, `docker compose down`, remoção/prune de volumes, `wsl --shutdown`, `flyway repair`, alteração de migration, criação manual Liquibase, `git reset --hard`, `git clean`, `git stash`, force push ou merge. A stack não foi parada porque nunca pôde ser iniciada.

## Pendências

Em Windows com Docker Desktop Linux, Node compatível, `.env` seguro e acesso aos registries:

1. atualizar/confirmar latest `main` e executar o BAT oficial;
2. repetir o backend verify com dependências resolvidas;
3. repetir todos os builds com Node suportado;
4. validar ambos os Compose configs e imagens artifact-only;
5. comprovar os seis serviços, logs e ausência de restart loop;
6. executar `scripts\\validate-database-state.bat dev` e queries somente leitura Liquibase/Flyway;
7. testar endpoints, proxies, segurança/observabilidade e smoke UI completo;
8. deixar a stack ativa e registrar `ps -a`, data/hora e screenshots seguros.

## Estado final da aplicação

**`BLOQUEADO_POR_AMBIENTE`.** A aplicação **não ficou rodando** e `http://localhost:8088` **não está disponível** neste runner. Containers em execução: nenhum. Para parar posteriormente em um ambiente que tenha iniciado a stack, deve-se usar o comando Compose correspondente **sem `-v`**; ele não foi executado nesta task.

## Git final

Branch de entrega: `validation/runtime-completa-v051`. Arquivos intencionalmente alterados: `automation-worker/src/PdfTextExtractor.ts` e este relatório. A evidência final de `git diff --check`, `git status --short`, commit e PR é registrada na entrega Git e na resposta final, pois o SHA do próprio commit não pode ser autorreferenciado dentro de seu conteúdo.
