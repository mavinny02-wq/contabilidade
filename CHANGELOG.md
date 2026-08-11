# Changelog

## Não lançado

### Segurança da sessão interativa

- transforma o ticket HMAC em credencial de troca de uso único;
- persiste o consumo do `jti` no PostgreSQL pela migration V8;
- bloqueia replay entre workers e após restart do worker;
- troca o ticket por grant opaco em cookie `HttpOnly` e `SameSite=Strict`;
- limita sessões interativas e assinantes SSE por worker, com resposta 429 e capacidade no health;
- preserva HMAC, TTL, autorização e a proibição de bypass de CAPTCHA.

### Performance e operação do Centro de Certidões

- substitui cargas globais do scheduler por queries bounded de IDs;
- processa inicialização, agendamento e alertas em lotes configuráveis e transações por item;
- usa cursores rotativos com wrap para evitar starvation;
- adiciona solicitação de até 500 acompanhamentos por lote, com idempotência e resultado por item;
- adiciona dashboard gerencial bounded e exportação CSV segura;
- adiciona agenda de vencimentos por período e empresa, sem acionar providers externos.

### Backup e storage

- gera manifesto por conjunto com versão, timestamp, componentes, tamanhos e SHA-256;
- adiciona verificadores PowerShell e shell sem restauração;
- adiciona inventário read-only e verificação de integridade na interface;
- monta o diretório de backups como read-only no backend;
- reconcilia referências do PostgreSQL e arquivos do storage sem correção automática;
- rejeita path traversal, symlinks e componentes inconsistentes.

### Observabilidade

- classifica heartbeat recente, atrasado, expirado, futuro e ausente;
- mostra versão, último heartbeat e idade na Console Técnica;
- consolida histórico de providers por status, taxa de sucesso, duração média e última execução;
- soma custo estimado separadamente por moeda;
- não expõe payload, resultado, protocolo, empresa ou segredo no histórico de providers.

### Documentos e integridade

- recalcula tamanho e SHA-256 antes do download;
- bloqueia divergência e registra ocorrência segura em auditoria isolada;
- adiciona prévia read-only de retenção documental por critérios configuráveis;
- adiciona preview inline seguro de PDF, PNG e JPEG após nova validação de integridade;
- aplica `inline`, `no-store`, `nosniff`, same-origin e CSP sandbox no preview;
- mantém formatos não suportados disponíveis apenas pelo download autorizado.

### Empresas e filiais

- permite editar, inativar e reativar cada filial sem alterar o CNPJ;
- sincroniza acompanhamentos aplicáveis após mudança de UF ou estado ativo;
- adiciona importação CSV UTF-8 com modelo, validação prévia e resultado por linha;
- adiciona histórico cadastral da empresa e das filiais sem `detalhes_json`;
- adiciona grupo opcional e até vinte tags por empresa;
- amplia a busca para grupo e tag;
- adiciona migration V9 com `empresas.grupo`, `empresa_tags` e índices normalizados.

### Auditoria

- adiciona filtros por ação, recurso, ator e período;
- exporta CSV com snapshot temporal, lotes, limite e proteção contra fórmula;
- exclui deliberadamente `detalhes_json` da exportação;
- registra eventos seguros de exportação, classificação, preview, backup e retenção.

### Administração segura

- adiciona visão da configuração efetiva sem retornar tokens, segredos, URLs completas ou referências sensíveis;
- sinaliza segurança desabilitada, valores de exemplo e providers habilitados com configuração incompleta;
- apresenta apenas presença, adequação e parâmetros operacionais seguros;
- não altera configuração nem chama providers externos.

### Shutdown gracioso do worker

- interrompe novas aquisições ao receber `SIGTERM` ou `SIGINT`;
- aguarda a execução atual antes de fechar servidor HTTP e browser;
- mantém sessão interativa disponível durante o drain normal;
- trata timeout e segundo sinal sem mascarar interrupção;
- adiciona grace period configurável ao Compose `dev` e `onpremise`.

### Pendências

- build completo Maven/frontend/worker da `main` atual;
- execução Docker, Keycloak/Liquibase e Flyway V1–V9;
- healthchecks, endpoints, proxies e smoke UI;
- provas runtime focadas dos itens integrados pelas PRs `#14` a `#41`;
- testes automatizados permanentes e E2E;
- providers fiscais reais somente após autorização, credenciais e ambiente adequados.

## 0.5.1 — 2026-08-09

- corrige os blockers TypeScript identificados na validação canônica da v0.5.0;
- melhora o BAT para localizar ou instalar JDK 21 sem remover Java 17;
- exige que o Maven use a JVM 21 selecionada;
- melhora detecção de Node 22.12+ e geração explícita de lockfiles;
- ignora artefatos TypeScript/Docker locais gerados;
- prepara o fluxo de validação artifact-only e startup sequencial.

## 0.5.0 — 2026-08-09

### Provider oficial Serpro

- fluxo `SERPRO::CERTIDAO_FEDERAL_RFB_PGFN` em modo API sem browser;
- OAuth2 `client_credentials`, cache e renovação de bearer token;
- bearer estático somente com opt-in explícito para demonstração;
- request oficial, status 1–15 e 99, continuidade do status 7 somente em memória;
- CND e CPEND normalizadas;
- PDF, CNPJ base, emissão e validade validados;
- upload com origem `API_OFICIAL`;
- custo estimado/acumulado e moeda preservados;
- provider desabilitado por padrão.

### Modelo Federal

- acompanhamento Federal somente na matriz;
- acompanhamentos antigos de filiais inativados sem exclusão de documentos ou histórico.

### Pendências históricas

- contrato, credenciais, custo vigente e chamada autorizada;
- amostras reais anonimizadas e conferência de faturamento;
- testes automatizados e E2E.

## 0.4.0 — 2026-08-09

- integra fluxos assistidos SEFAZ-SP e PGE-SP;
- preserva CAPTCHA para intervenção humana, sem bypass;
- exige PDF oficial e valida CNPJ/CNPJ base;
- mantém providers desabilitados até prova autorizada;
- inativa acompanhamentos antigos de forma não destrutiva.

## 0.3.0 — 2026-08-09

- integra portal Federal assistido;
- adiciona sessão interativa CDP/SSE com mouse, teclado e retomada confirmada;
- captura PDF por download, resposta, popup/blob e link;
- rejeita HTML como certidão oficial;
- valida PDF e CNPJ;
- não persiste quadros do screencast nem contorna CAPTCHA.

## 0.2.0 — 2026-08-09

- fila PostgreSQL com lease, retry, idempotência e fallback;
- providers, políticas, custo e intervenção humana;
- worker Playwright com polling e heartbeat;
- documentos, auditoria e notificações;
- Empresas, matriz, filiais e Empresa 360;
- Centro de Certidões Federal, SEFAZ-SP e PGE-SP;
- administração de providers, execuções, intervenções e Console Técnica.

## 0.1.0 — 2026-08-09

- baseline on-premise;
- estrutura inicial backend, frontend e worker;
- documentação e orquestração.
