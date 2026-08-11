# Validação Cloud completa — v0.5.1

## Escopo e limites do Codex Cloud

Validação `VAL-CLOUD-V051-002`, executada em Linux Cloud em 2026-08-11. O escopo cobriu leitura da
baseline, toolchain, builds suportados, startup controlado do worker, PDF sintético, manifests e
análise estática. Nenhum portal, provider externo, credencial, dado fiscal real ou chamada paga foi
usado. Docker não está instalado; portanto, não houve Compose runtime, banco, Keycloak, endpoints,
UI servida nem stack persistente. A ausência foi verificada uma única vez e não foi simulada.

## Baseline Git

- commit inicial: `7580af46ec57fdc698d22b7301475c20e0933fc6`, exatamente o baseline mínimo esperado;
- versão: `0.5.1`;
- branch inicial do checkout: `work`; branch de entrega: `validation/cloud-v051-002`;
- working tree inicial: limpa;
- últimos commits: merge da PR #11 (`7580af4`), evidência anterior (`be9403c`), merge da PR #10
  (`e46f85e`), atualização de roadmap (`9554915`) e pendência Windows (`b26de30`);
- o checkout não possui remoto configurado. O baseline local foi confirmado, mas não foi possível
  provar atualização remota de `main`.

## Ambiente e toolchain

| Capacidade | Evidência Cloud | Resultado |
|---|---|---|
| Kernel | Linux x86_64 6.18.35 | disponível |
| Git | 2.43.0 | disponível |
| Java/Javac | OpenJDK 21.0.2 | compatível |
| Maven | 3.9.10 | disponível; registry bloqueou dependência |
| Node.js | 20.20.2 | abaixo do engine `>=22.12.0` do projeto |
| npm | 11.4.2 | compatível com o requisito npm do frontend |
| Python | 3.12.13 | disponível |
| Docker/runtime | executável ausente | `BLOQUEADO_POR_AMBIENTE` apenas para runtime |

O npm também avisou que a configuração ambiental `http-proxy` será removida em uma futura versão.
Esse warning não impediu instalações ou builds.

## Backend

`mvn -B clean verify` foi executado uma vez e terminou com exit code 1 antes de construir o projeto:
o Maven Central respondeu HTTP 403 ao parent `spring-boot-starter-parent:3.5.16`. A falha é de acesso
a registry neste executor; não houve alteração de parent, repositório ou regra de negócio, nem
repetição sem mudança de condição. Assim, compilação, testes, JAR e empacotamento das migrations não
foram comprovados nesta execução.

A inspeção confirmou Java 21/Spring Boot, Flyway como mecanismo de schema, health/readiness, JWT e
catálogo de permissões. As rotas internas são liberadas no filtro HTTP, mas os controllers internos
aplicam validação dedicada de `X-Worker-Token`. Downloads de documento têm autorização explícita.
Listagens de usuário usam paginação; a carga global de estabelecimentos no centro de certidões foi
registrada como risco de escala preexistente, não blocker funcional desta validação.

## Frontend

Com o lockfile rastreado:

- `npm ci`: exit 0;
- `npm run locale:validate`: exit 0, 42 arquivos e 86 entradas dinâmicas verificadas;
- `npm run typecheck`: exit 0;
- `npm run build`: exit 0, 111 módulos e bundle principal de 452,93 kB (138,04 kB gzip);
- não existe script `test`, portanto nenhum teste frontend adicional foi inventado.

O Node 20 gerou `EBADENGINE`, pois o pacote exige Node `>=22.12.0`; mesmo assim todas as provas acima
passaram. A inspeção encontrou rotas protegidas, checagem de permissões, tratamento centralizado de
API, textos via i18n e nenhum uso de `alert`, `prompt` ou `confirm`. O Nginx oferece healthcheck,
proxy de API/worker/Keycloak e fallback SPA. Não foram encontrados artefatos `dist`, `target` ou
`node_modules` rastreados.

## Automation worker

Com o lockfile rastreado:

- `npm ci`: exit 0;
- `npm run typecheck`: exit 0;
- `npm run build`: exit 0;
- não existe script `test`;
- startup controlado: exit 124 por timeout intencional após 8 segundos.

O startup registrou os quatro fluxos (portal federal, PGE-SP, SEFAZ-SP e Serpro) e não apresentou
crash de import, `DOMMatrix`, `ImageData`, `Path2D` ou módulo nativo. `ECONNREFUSED` ocorreu somente
contra o backend deliberadamente inexistente. A ausência do binário Chromium foi degradada de forma
controlada, mantendo os fluxos API disponíveis; nenhum browser externo ou provider foi acionado.

A inspeção confirmou registry dos quatro fluxos, sessão humana auditável para CAPTCHA, parser PDF e
fallbacks Node. Não existe lógica de resolução/bypass de CAPTCHA. O Serpro permanece desabilitado na
migration e sem credenciais por padrão; tokens/segredos não são escritos nos logs.

## PDF sintético

Foi gerado em `/tmp` um PDF mínimo contendo apenas `DOCUMENTO FICTICIO PARA TESTE CLOUD`, sem dado
fiscal e sem aparência de certidão. A chamada direta a `extractTextFromPdf` retornou exatamente o
texto esperado, com `DOMMatrix`, `ImageData` e `Path2D` disponíveis como funções. Exit code 0. O
arquivo temporário foi removido e nenhuma dependência ou fixture foi adicionada ao repositório.

## Compose e Dockerfiles — análise estática

Os três YAML foram lidos integralmente. PyYAML não estava instalado (tentativa de parser: exit 3),
mas o parser YAML padrão do Ruby validou `compose.yaml`, `compose.dev.yaml` e
`compose.onpremise.yaml` com exit 0. O manifesto base contém PostgreSQL, `postgres-bootstrap`,
Keycloak, backend, worker e frontend; `depends_on` expressa a sequência PostgreSQL saudável →
bootstrap concluído → Keycloak saudável → backend saudável → worker/frontend. Há healthchecks,
rede e volumes nomeados. `ApplicationName` aparece nas conexões PostgreSQL de Keycloak e backend.
Segredos obrigatórios são interpolados do ambiente, e credenciais opcionais do Serpro ficam vazias.

Por inspeção, os Dockerfiles usam Java 21, Node 24, Nginx 1.27 e Playwright 1.60. O backend e frontend
separam build/runtime; o worker leva apenas dependências de produção e `dist` ao estágio final. Há
usuário não-root explícito no backend e worker. Nenhum segredo é copiado. O runtime Docker não foi
executado e, portanto, compatibilidade efetiva das imagens não foi alegada.

## Scripts

`sh -n infra/postgres/init/01-create-keycloak-db.sh` terminou com exit 0. Os scripts BAT e PowerShell
foram somente analisados como texto: não há labels duplicados, `down -v` ou comando destrutivo; os
scripts referenciados existem; quoting, sequência, `EnableDelayedExpansion`, uso de `!`, composição
de overrides e `pause` foram revisados. Os arquivos não foram executados no Cloud. Os dois realms e
o plano da onda passaram por `python -m json.tool` com exit 0.

## Migrations

V1–V7 foram lidas integralmente, em sequência única e sem versão duplicada. V6 e V7 qualificam
corretamente alvo e origem nos `UPDATE ... FROM` (`certidao` e `estabelecimento`), sem referência
ambígua. Tabelas e colunas usadas são introduzidas nas versões anteriores. As migrations preservam
histórico por inativação e mantêm providers externos desabilitados. Não houve PostgreSQL disponível;
logo, SQL e checksums não foram alegados como executados, e nenhuma migration consolidada foi alterada.

## Segurança

Não houve acesso a portais governamentais, providers reais, credenciais, CNPJ, documentos fiscais,
CAPTCHA ou operações pagas. Nenhum segredo, token, cookie, `.env` ou payload fiscal foi exibido. Não
foram usados `flyway repair`, criação manual de tabelas, operação destrutiva ou ativação de provider.
A análise não encontrou segredo literal de implantação nos manifests; valores locais declarados no
código são fallbacks de desenvolvimento e os manifests de implantação exigem substituição.

## Falhas encontradas

1. Evidência histórica da PR #11 classificada enganosamente como execução local, embora o próprio
   conteúdo registre um container Linux Cloud — blocker documental determinístico.
2. Maven Central retornou HTTP 403 — limitação do ambiente, não falha de código comprovada.
3. Node 20 está abaixo do engine requerido — warning ambiental; frontend e worker passaram.
4. Docker e browser Playwright não estão instalados — limitações do executor para runtime.
5. PyYAML não está instalado — sem impacto, pois o parser YAML já disponível no Ruby concluiu a prova.

Nenhum blocker de código executável reproduzível permaneceu após as validações Cloud.

## Correções realizadas

- a evidência histórica foi preservada, mas o título foi corrigido para declarar que a tentativa
  ocorreu indevidamente no Codex Cloud, com nota explícita de que não foi execução local;
- as regras de tasks agora definem os contratos `CODEX_CLOUD_LINUX` e `LOCAL_WINDOWS`, exigem
  capacidades antes dos comandos e separam prova Cloud de prova de runtime local;
- este relatório substancial registra somente evidências realmente produzidas no Cloud.

Não houve alteração de código, regra fiscal, dependency lock ou migration.

## Comandos e exit codes

| Comando | Exit | Observação |
|---|---:|---|
| `uname -a`; versões Git/Java/Javac/Maven/Node/npm/Python | 0 | inventário real |
| `command -v docker` | 0 do invólucro | nenhuma saída: Docker ausente |
| `mvn -B clean verify` | 1 | HTTP 403 no parent Maven |
| frontend `npm ci` / `locale:validate` / `typecheck` / `build` | 0 / 0 / 0 / 0 | build aprovado |
| worker `npm ci` / `typecheck` / `build` | 0 / 0 / 0 | build aprovado |
| startup controlado do worker | 124 | timeout intencional; import aprovado |
| extração do PDF sintético | 0 | texto exato; arquivo removido |
| parser PyYAML | 3 | módulo ausente |
| parser YAML Ruby nos três manifests | 0 | sintaxe aprovada |
| `sh -n infra/postgres/init/01-create-keycloak-db.sh` | 0 | sintaxe aprovada |
| validação JSON dos realms e plano | 0 | sintaxe aprovada |
| análise estática BAT/PowerShell | 0 | nenhum blocker encontrado |

## Provas Cloud resolvidas

Baseline/versão, toolchain, lockfiles, i18n, TypeScript, bundles frontend/worker, import/startup do
worker, registry dos quatro fluxos, extração PDF.js com fallbacks, sintaxe YAML/JSON/shell, estrutura
de Compose/Dockerfiles, migrations V1–V7, configuração JWT/Keycloak e controles estáticos de
segurança foram validados no limite factual descrito acima.

## Provas que exigem Windows/Docker local

Continuam pendentes, sem fechar `GATE-VAL-001`: Maven em ambiente com registry acessível; JDK e Node
suportados no executor alvo; Docker Compose; PostgreSQL/Flyway; Keycloak/Liquibase; healthchecks e
endpoints reais; proxy e UI servida; persistência/restart da stack. Os cinco previews não foram
promovidos.

## Classificação Cloud

**`CLOUD_AMARELO`** — tudo que pôde ser executado no Cloud passou, exceto o backend bloqueado por
HTTP 403 no registry; também permanecem warnings de Node abaixo do engine e limitações de runtime.
Não há base para classificação de runtime ou fechamento do gate.

## Git final

Branch de entrega: `validation/cloud-v051-002`. Arquivos intencionalmente alterados: este relatório,
`docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md` e `docs/ai/REGRAS_TASKS_CODEX.md`. O status, o
diff check, o commit e a PR são registrados na entrega final, pois o SHA do próprio commit não pode
ser autorreferenciado neste arquivo.

---

## Validação consolidada `VAL-CLOUD-CONSOLIDATED-V051-001` — baseline `fc310e0b147db8e3fccf41febc9cf84bce617909`

### Identificação e pré-condições

Execução realizada em 2026-08-11 no executor efêmero `CODEX_CLOUD_LINUX`, branch
`validation/cloud-consolidated-v051`, a partir do SHA
`fc310e0b147db8e3fccf41febc9cf84bce617909` e da versão `0.5.1`. Esse SHA é também o SHA final do
código validado: a única alteração desta entrega é o acréscimo desta evidência documental. O SHA do
commit que contém o relatório é informado na entrega e na PR, pois um arquivo não pode conter de
forma autorreferente o hash do próprio commit.

A preparação `contabilidade-prepare e2e` terminou com exit 0. O comando obrigatório
`contabilidade-maintenance` não existe neste executor e terminou com exit 127. Além disso, o
checkout recebido não contém os scripts permanentes de startup Cloud e E2E atribuídos ao Slot 4:
a busca em `scripts/` não encontrou arquivo Cloud/E2E/startup Linux. Portanto, a pré-condição de
executar somente após a integração dos Slots 1–4 não pôde ser confirmada e a prova full-stack
prescrita não pôde ser iniciada. Não foi criado substituto ad hoc, para não produzir evidência
canônica diferente da automação permanente que deveria estar em `main`.

### Toolchain exata

| Ferramenta | Versão |
|---|---|
| Git | `2.43.0` |
| Java | OpenJDK `21.0.2` |
| Maven | `3.9.10` |
| Node.js | `20.20.2` |
| npm | `11.4.2` |
| PostgreSQL/psql | `16.14` (`Ubuntu 16.14-0ubuntu0.24.04.1`) |
| Playwright | `1.60.0` |
| Chromium do Playwright | Chrome for Testing `148.0.7778.96` |

O perfil instalou Node 24.15.0, mas o shell da task continuou resolvendo Node 20.20.2. Por isso os
`npm ci` emitiram `EBADENGINE`; instalações, testes e builds ainda terminaram com sucesso. Esta
divergência ambiental não foi mascarada nem corrigida por alteração de dependências.

### Backend, banco e Flyway

A primeira tentativa de `mvn -B clean verify` terminou com exit 1 porque PostgreSQL ainda não estava
instalado/ativo. Após instalar PostgreSQL 16 no executor e criar um banco local dedicado sem dados
reais, uma tentativa expôs que as variáveis `SPRING_DATASOURCE_*` predefinidas pelo executor
sobrepunham o nome padrão do teste; o banco apontado por esse ambiente foi então criado localmente,
sem alterar código ou configuração versionada.

O gate reiniciado com `cd backend && mvn -B clean verify` terminou com exit 0: compilou 163 fontes,
executou o teste de integração PostgreSQL (1 teste, 0 falhas, 0 erros), aplicou V1–V12 sobre schema
vazio e gerou o JAR. A primeira inicialização aplicou exatamente 12 migrations. Uma segunda
inicialização do JAR terminou com readiness `{"status":"UP"}`, validou as 12 migrations, reconheceu
a versão 12 e informou que nenhuma migration era necessária. Assim, criação limpa e repetição
Flyway ficaram verdes.

### Frontend

| Comando | Exit | Evidência |
|---|---:|---|
| `npm ci --prefer-offline --no-audit --no-fund` | 0 | 232 pacotes instalados pelo lockfile |
| `npm run locale:validate` | 0 | 22 catálogos, 64 arquivos e 86 entradas dinâmicas |
| `npm run typecheck` | 0 | TypeScript sem erro |
| `npm test` | 0 | 7 arquivos e 20 testes aprovados |
| `npm run build` | 0 | 152 módulos; bundle produzido |

O build alertou somente que o chunk principal minificado tem 543,27 kB. O artefato local foi
ignorado pelo Git e o arquivo incremental rastreado foi restaurado, evitando alteração gerada.

### Automation worker, PDF e Chromium

| Comando | Exit | Evidência |
|---|---:|---|
| `npm ci --prefer-offline --no-audit --no-fund` | 0 | 50 pacotes instalados pelo lockfile |
| `npm run typecheck` | 0 | TypeScript sem erro |
| `npm test` | 0 | 7 testes aprovados |
| `npm run build` | 0 | compilação aprovada |

Os testes cobriram runtime/configuração, ticket e sessão, PDF sintético temporário, registry com
providers reais desabilitados, shutdown gracioso e smoke do Chromium restrito a páginas locais. O
Chromium empacotado foi realmente iniciado e encerrado pelo teste Playwright. Nenhum dado fiscal
real foi usado.

### Full stack, API e navegador E2E

A segunda inicialização local comprovou backend, PostgreSQL, Flyway e readiness da API. A prova
full-stack/browser E2E permanente não foi executada porque os scripts que o enunciado atribui ao
Slot 4 não existem no baseline recebido. Isso não foi interpretado como aprovação e impede
`CLOUD_VERDE`. Não há Docker neste executor e nenhuma conclusão Windows/Docker foi inferida.

### Defeitos, regressões e chamadas externas

As duas falhas iniciais do backend foram reproduzidas e classificadas como preparação de ambiente:
PostgreSQL ausente e database indicado por variáveis já presentes no executor ausente. Não houve
defeito determinístico de repositório demonstrado depois da preparação, portanto nenhum código ou
teste foi alterado. A indisponibilidade dos scripts do Slot 4 é uma violação da pré-condição do
baseline, não algo que este slot de consolidação deva ocultar com script improvisado.

Nenhum portal, provider externo, CAPTCHA, credencial, documento fiscal, dado pessoal ou operação
paga foi chamado. Todos os testes de browser/PDF foram determinísticos e locais; os providers reais
permaneceram desabilitados.

### Higiene e provas restantes

`git diff --check` terminou com exit 0. A inspeção de arquivos rastreados não encontrou `dist/`,
`target/` ou `node_modules/`; somente `.env.example` é rastreado, e nenhum segredo, `.env`, payload
fiscal ou dado real foi acrescentado. A alteração intencional é exclusivamente este relatório.

Continuam pendentes: integrar e executar os scripts permanentes do Slot 4 para full-stack/API/E2E;
executar a prova manual separada em Windows/Docker; validar Compose, Keycloak, persistência/restart
e operação on-premise no runtime alvo. Evidência Cloud não fecha o gate Windows/Docker e não
classifica a aplicação inteira como pronta para produção.

### Classificação Cloud consolidada

**`CLOUD_AMARELO`** — backend, PostgreSQL/Flyway limpo e repetido, frontend e worker (incluindo PDF,
runtime e Chromium local) passaram. `CLOUD_VERDE` é vedado porque o baseline não contém a automação
permanente do Slot 4 e, consequentemente, o full-stack/API/browser E2E consolidado não foi executado.
O executor Cloud é efêmero e não pode manter uma URL permanente de serviço após o término da task.
