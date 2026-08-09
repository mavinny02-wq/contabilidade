# Análise completa do baseline 0.5.0

**Item:** `HIST-VAL-001`
**Execução:** `CLOUD_FIRST`
**Data:** 2026-08-09
**Resultado:** `REPROVADO PARA ONDA NORMAL — GATE_SERIAL NECESSÁRIO`

## 1. Baseline e estado Git

| Evidência | Resultado |
|---|---|
| Branch fornecida | `work` (não é `main`) |
| HEAD inicial | `1ab637c2eee438adc287efd1abb25c35a8c37bcc` |
| Upstream | ausente (`fatal: no upstream configured for branch 'work'`) |
| `VERSION` | `0.5.0` |
| Estado inicial | limpo; nenhum item em `git status --short` |
| Estado após validações, antes da entrega | somente arquivos permitidos desta task; artefatos rastreados alterados pelo TypeScript foram restaurados |
| Baseline esperado | conteúdo e manifests 0.5.0 presentes, mas equivalência com o último `main` remoto não comprovável sem upstream |

Contagem de arquivos rastreados: backend 118, frontend 60, worker 24, docs 52, infra 4, scripts 14 e
orquestrador 7. Não havia untracked inicial. O repositório rastreia artefatos gerados obsoletos:
`tsconfig.*.tsbuildinfo`, `vite.config.js` e `vite.config.d.ts`; `public/config.js` e `vite-env.d.ts` são
artefatos intencionais de runtime/tipagem. Não há `node_modules`, `dist` ou `target` rastreados.

## 2. Inventário real

| Capacidade | Classificação | Evidência/responsabilidade |
|---|---|---|
| Backend Spring/Java 21 | `BLOQUEADO POR AMBIENTE` | 102 fontes, APIs e serviços; Maven bloqueado por HTTP 403 antes da compilação |
| Frontend React/TS | `PARCIAL` | rotas e telas reais; typecheck/build falham em sessão interativa |
| Worker Playwright | `PARCIAL` | polling, browser, HTTP e health; typecheck/build falham nos parsers PDF |
| Flyway/PostgreSQL | `BLOQUEADO POR AMBIENTE` | V1–V7 ordenadas; Docker/PostgreSQL indisponível |
| Keycloak | `BLOQUEADO POR AMBIENTE` | realms dev/produção e JWT configurados; runtime não executado |
| Docker/Compose | `BLOQUEADO POR AMBIENTE` | três arquivos coerentes por inspeção; CLI ausente |
| Scripts local/on-premise | `PARCIAL` | start/stop/status/log/backup/preflights presentes; validação runtime pendente |
| Common | `IMPLEMENTADO` | segurança, erro, auditoria, documentos, fila, providers, intervenção, busca e console |
| Empresas/estabelecimentos | `IMPLEMENTADO` | domínio, API, matriz/filiais e inativação lógica |
| Documentos/evidências | `IMPLEMENTADO` | storage abstrato/local, hash, assinatura, vínculo e autorização |
| Execuções/leases/retry | `IMPLEMENTADO` | aquisição e recuperação transacional, idempotência e fallback |
| Providers/políticas/custo | `IMPLEMENTADO` | roteamento, habilitação, custo/moeda e limites |
| Intervenção humana | `PARCIAL` | backend e worker presentes; frontend não compila e runtime não comprovado |
| Centro de Certidões/manual | `IMPLEMENTADO` | acompanhamento, histórico, scheduler e documento obrigatório |
| Portal Federal | `BLOQUEADO POR AMBIENTE` | fluxo implementado; portal/CAPTCHA/PDF autorizado não executado |
| SEFAZ-SP | `BLOQUEADO POR AMBIENTE` | fluxo implementado, contrariando documentos antigos que dizem pendente; runtime não executado |
| PGE-SP | `BLOQUEADO POR AMBIENTE` | fluxo implementado, runtime não executado |
| Serpro CND | `BLOQUEADO POR AMBIENTE` | client e token presentes, provider desabilitado; chamada paga proibida |
| i18n pt-BR | `IMPLEMENTADO` | validação passou: 42 arquivos e 86 entradas dinâmicas |
| Auditoria/notificações/busca/console | `IMPLEMENTADO` | APIs e UI presentes; persistência/runtime não comprovados |

## 3. Dependências e lockfiles

Maven declara Spring Boot 3.5.16, Java 21 e springdoc 2.8.9; versões transitivas vêm do BOM. Frontend:
React 19.2.8, Router 7.15.1, i18next 25.10.10, Keycloak JS 26.2.0, Vite 7.3.6 e TS 5.9.3. Worker:
Playwright 1.60.0, pdfjs-dist 6.1.200, TS 5.9.3 e tsx 4.20.5. Node exigido é >=22.12 e o ambiente
forneceu 20.20.2: engine incompatível. Ambos os `package-lock.json` estão ausentes; portanto os dois
`npm ci` falham antes de instalar e reprodutibilidade não existe.

Não foi detectada duplicidade direta nem licença direta GPL-3/AGPL/desconhecida. O registro canônico
atribui Apache-2.0, MIT, BSD ou licença PostgreSQL. Sem resolução Maven/npm e lockfiles não foi
possível auditar todas as versões/licenças transitivas: a prova continua pendente.

## 4. Backend, persistência e segurança

A inspeção encontrou `@PreAuthorize` nas APIs de negócio, catálogo central de permissões, JWT roles,
contrato global de erro, validação Bean Validation, storage normalizado e token interno comparado em
tempo constante. `/api/interno/**` é publicamente liberado no filtro HTTP, mas os controladores
internos chamam `WorkerTokenService`; essa defesa precisa de teste de integração. O modo dev libera
todas as rotas deliberadamente e o override dev força autenticação desativada.

Fila e leases usam transações e SQL com `FOR UPDATE SKIP LOCKED`; a recuperação limita lotes. A chave
de idempotência tem regra de conflito no serviço/migration. V7 apenas atualiza provider e inativa
acompanhamentos federais de filial; não apaga histórico/documentos. V1–V7 são sequenciais, sem número
duplicado. Compatibilidade real de entidades, constraints, índices e banco novo permanece não
comprovada porque PostgreSQL/Flyway não rodaram.

Há consultas `findAll()` sem limite em políticas/providers e carga global de estabelecimentos no
Centro de Certidões, risco de escala, não falha funcional comprovada. Não foi encontrada exclusão
física dominante em registros rastreáveis nem log explícito de segredo/payload fiscal completo.
Uploads têm limite/MIME/assinatura e download verifica propriedade/autorização. PDFs externos são
validados, mas parsers não compilam nesta árvore.

Tickets de sessão têm HMAC, expiração, vínculo a sessão/intervenção/execução/usuário e Nginx sem
access log em `/automation/`. O worker valida assinatura/sessão/expiração, porém não mantém consumo de
`jti`; repetição dentro da validade é possível. CORS é allowlist configurável com credenciais. Realm
dev contém credenciais demonstrativas e não deve ser usado on-premise. TLS é requisito documental,
não encerrado pelo Compose.

## 5. Frontend e worker

Rotas protegidas e catálogo frontend espelham permissões, mas o backend permanece autoridade. OIDC é
configurável em `config.js`; erros usam contrato `ApiError`. O validador i18n passou. A compilação
falha em `InteractiveSessionModal.tsx:273`: a união `ApiError | Error` não permite acesso direto a
`message`. Isso bloqueia a imagem real do frontend.

O worker inicia servidor/health, heartbeat, polling, renovação, cancelamento e sessão interativa; o
registry contém Federal, SEFAZ-SP, PGE-SP e Serpro. Não há bypass de CAPTCHA: desafios suspendem para
humano. O build falha em `PdfCertificateParser.ts:41` e `StateCertificatePdfParser.ts:122`, pois os
tipos resolvidos de `PDFDocumentProxy` não expõem `destroy`. Nenhuma navegação, CNPJ, credencial ou
chamada paga foi usada.

## 6. Docker, Keycloak, operação e backup

Por inspeção, Compose define healthchecks, dependências condicionais, volume PostgreSQL, diretório de
documentos, realm importado, worker com seccomp/1 GiB shm e reinício. Dev publica banco/backend/worker
e desativa autenticação; on-premise troca Keycloak para `start`, mas mantém HTTP interno e exige TLS
externo. Os scripts não contêm reset/clean/stash automático; preflights consultam saúde/registro e não
executam operação fiscal paga. Backup preserva dump e documentos; restauração é manual. A instrução
on-premise antiga usa `up -d --build`, enquanto o novo BAT oferece o contrato artifact-only.

Docker não existe no ambiente (`command not found`): nenhum `compose config`, banco, Flyway,
Keycloak, imagem, startup, healthcheck, backup ou restauração foi alegado como aprovado.

## 7. Achados permanentes

### BUG-VAL-001

- **Severidade:** `BLOCKER`
- **Domínio:** Frontend
- **Status:** `CONFIRMADO`
- **Evidência:** `npm run typecheck` e `npm run build` retornam TS2339 em `InteractiveSessionModal.tsx:273`.
- **Impacto:** frontend 0.5.0 não gera artefato reproduzível.
- **Reprodução:** `cd frontend && npm run typecheck`.
- **Próxima ação:** corrigir narrowing em task de bug fix e validar separadamente.
- **Prova pendente:** typecheck/build limpos após lockfile revisado e Node suportado.

### BUG-VAL-002

- **Severidade:** `BLOCKER`
- **Domínio:** Automation worker
- **Status:** `CONFIRMADO`
- **Evidência:** typecheck/build retornam TS2339 para `PDFDocumentProxy.destroy` em dois parsers.
- **Impacto:** worker e fluxos PDF/portal/Serpro não geram artefato.
- **Reprodução:** `cd automation-worker && npm run typecheck`.
- **Próxima ação:** reconciliar API/tipos de pdfjs em bug fix sem afrouxar a validação PDF.
- **Prova pendente:** typecheck/build limpos e validação PDF em task explícita.

### DEBT-VAL-001

- **Severidade:** `HIGH`
- **Domínio:** Dependências
- **Status:** `CONFIRMADO`
- **Evidência:** lockfiles ausentes e `npm ci` EUSAGE nos dois pacotes.
- **Impacto:** instalações não reprodutíveis; licenças/transitivos e BAT ficam bloqueados.
- **Reprodução:** `find frontend automation-worker -name package-lock.json`; `npm ci`.
- **Próxima ação:** gerar/revisar lockfiles em ambiente Node 22.12+ e commit dedicado.
- **Prova pendente:** `npm ci` limpo nos dois componentes e auditoria de licenças.

### SEC-VAL-001

- **Severidade:** `HIGH`
- **Domínio:** Sessão interativa
- **Status:** `CONFIRMADO POR INSPEÇÃO`
- **Evidência:** ticket inclui `jti`, mas `SessionTicketVerifier` não registra/rejeita reutilização.
- **Impacto:** URL capturada pode ser reutilizada até expirar, sujeita às demais vinculações.
- **Reprodução:** inspecionar `SessionTicket.ts` e ausência de armazenamento de consumo.
- **Próxima ação:** decidir política anti-replay e implementar consumo/rotação auditável.
- **Prova pendente:** teste explícito de replay, expiração e vínculo de usuário.

### ENV-VAL-001

- **Severidade:** `HIGH`
- **Domínio:** Baseline/Git
- **Status:** `BLOQUEADO POR AMBIENTE`
- **Evidência:** branch `work`, HEAD acima e upstream ausente.
- **Impacto:** não se prova que o conteúdo é o último `main` do remoto solicitado.
- **Reprodução:** `git branch --show-current` e `git rev-parse @{upstream}`.
- **Próxima ação:** reconciliar em runner com `origin/main` acessível antes do gate.
- **Prova pendente:** SHA comum/ancestralidade com último `main`.

### ENV-VAL-002

- **Severidade:** `MEDIUM`
- **Domínio:** Toolchain
- **Status:** `BLOQUEADO POR AMBIENTE`
- **Evidência:** Maven recebeu HTTP 403 no parent Spring Boot; Docker ausente; Node 20.20.2 abaixo de 22.12.
- **Impacto:** backend, Compose, Flyway, Keycloak e runtime não validados.
- **Reprodução:** comandos da seção 9.
- **Próxima ação:** executar gate em ambiente com registries, Node suportado e Docker.
- **Prova pendente:** builds, Compose config e stack limpa.

### DEBT-VAL-002

- **Severidade:** `LOW`
- **Domínio:** Higiene do repositório
- **Status:** `CONFIRMADO`
- **Evidência:** `.tsbuildinfo`, `vite.config.js` e `vite.config.d.ts` gerados estão rastreados e obsoletos.
- **Impacto:** builds sujam a árvore e podem mascarar versões antigas.
- **Reprodução:** `git ls-files | rg '\.(js|d.ts|tsbuildinfo)$'`.
- **Próxima ação:** remover/ignorar em task própria após confirmar consumidores.
- **Prova pendente:** build limpo sem dependência nesses arquivos.

## 8. Consistência documental e decisão de onda

`VERSION`, README e changelog concordam em 0.5.0. Documentos antigos contradizem o código ao dizer
que SEFAZ-SP/PGE-SP não têm fluxo; documentos atuais das integrações corretamente dizem
“implementação preparada/runtime pendente”. Nenhuma prova externa foi promovida. Diante de dois
blockers de compilação, ausência de lockfiles e baseline Git não comprovado, a próxima etapa é um
único `GATE_SERIAL`; não foram fabricados cinco slots.

## 9. Comandos e resultados exatos

### Executados e aprovados

- `java -version` — exit 0, OpenJDK 21.0.2.
- `mvn --version` — exit 0, Maven 3.9.10 sobre Java 21.0.2.
- `npm run locale:validate` — exit 0, “Bundle pt-BR válido. 42 arquivos e 86 entradas dinâmicas verificadas.”
- `git diff --check` — exit 0, sem saída.
- inspeções `git ls-files`, `rg`, `cat`, `find` — exit 0 conforme aplicável.

### Executados e falhos

- `mvn -B -DskipTests clean compile` — exit 1; parent Spring Boot 3.5.16 bloqueado por HTTP 403.
- `mvn -B -DskipTests package` — exit 1; mesmo HTTP 403.
- `cd frontend && npm ci` — exit 1/EUSAGE; `package-lock.json` ausente.
- `cd frontend && npm run typecheck` — exit 2; TS2339 na linha 273.
- `cd frontend && npm run build` — exit 1; mesmo TS2339.
- `cd automation-worker && npm ci` — exit 1/EUSAGE; lockfile ausente.
- `cd automation-worker && npm run typecheck` — exit 2; dois TS2339 em parsers PDF.
- `cd automation-worker && npm run build` — exit 2; mesmos erros.
- três variantes de `docker compose ... config` — exit 127; `docker: command not found`.

### Indisponíveis por ambiente

- PostgreSQL limpo/Flyway V1–V7, Keycloak, builds de imagens, stack e healthchecks: Docker ausente.
- resolução completa Maven/npm e licenças transitivas: registry Maven respondeu 403 e lockfiles faltam.
- validação Windows do BAT: runner é Linux.

### Deliberadamente não executados

- testes automatizados/E2E (não existem como escopo desta reconciliação);
- start da stack sem Docker e sem builds aprovados;
- restauração/backup real, pois mutaria estado operacional;
- correções de produção, migrations ou dependências, proibidas nesta task.

### Operações externas/pagas proibidas

Não foram executados portal Federal, SEFAZ-SP, PGE-SP, CAPTCHA, Serpro, credenciais/CNPJ reais,
consulta fiscal, download oficial ou chamada bilhetável.
