# Changelog

## Não lançado

### Segurança da sessão interativa

- transforma o ticket HMAC em credencial de troca de uso único;
- persiste o consumo do `jti` no PostgreSQL pela migration V8;
- bloqueia replay entre workers e após restart do worker;
- revalida intervenção, execução, sessão, operador, estado e expiração no backend;
- envia o ticket somente no primeiro `GET /info`;
- troca o ticket por grant opaco de 256 bits em cookie `HttpOnly` e `SameSite=Strict`;
- mantém no máximo um grant ativo por sessão e rotaciona o grant com ticket novo;
- recusa ticket bruto em endpoints de eventos e comandos;
- preserva HMAC, TTL, autorização e a proibição de bypass de CAPTCHA;
- amplia a validação operacional para Flyway V1–V8 e o ledger anti-replay.

### Performance do Centro de Certidões

- substitui cargas globais do scheduler por queries bounded de IDs;
- processa inicialização, agendamento e alertas em lotes configuráveis;
- usa cursores rotativos com wrap para evitar starvation;
- executa cada empresa, solicitação e alerta em transação própria;
- preserva a idempotency key diária;
- impede que configuração de provider ausente bloqueie o restante do lote.

### Backup verificável

- gera manifesto por conjunto com versão, timestamp, componentes, tamanhos e SHA-256;
- adiciona verificador PowerShell e shell sem restauração;
- rejeita componente ausente, tamanho/hash divergente, duplicidade e path traversal;
- remove apenas arquivos parciais do backup atual quando há falha;
- mantém o teste real de restauração como operação humana separada.

### Observabilidade do automation worker

- classifica heartbeat recente, atrasado, expirado, futuro e ausente;
- expõe estado saudável, degradado ou indisponível com motivo seguro;
- adiciona versão, último heartbeat e idade na Console Técnica;
- usa limiares e limite de listagem configuráveis;
- mantém indisponibilidade do worker separada de resultado fiscal e contagem de execuções com falha.

### Integridade documental

- recalcula tamanho e SHA-256 antes do download;
- compara o digest em tempo constante;
- entrega exatamente os bytes verificados;
- bloqueia divergência, metadados inválidos e falha de verificação;
- preserva a evidência divergente para investigação;
- registra ocorrência segura em auditoria isolada, sem hash bruto, path ou conteúdo.

### Pendências

- build completo Maven/frontend/worker da main atual;
- execução Docker, Flyway V1–V8, Keycloak/Liquibase e smoke UI;
- provas runtime focadas dos cinco itens integrados pelas PRs #14 a #18;
- testes automatizados permanentes e E2E.

## 0.5.1 — 2026-08-09

- corrige os blockers TypeScript identificados na validação canônica da v0.5.0;
- melhora o BAT para localizar ou instalar JDK 21 sem remover Java 17;
- exige que o Maven use a JVM 21 selecionada;
- melhora detecção de Node 22.12+ e geração explícita de lockfiles;
- ignora artefatos TypeScript/Docker locais gerados;
- prepara, sem selecionar, a próxima onda de cinco slots independentes.

## 0.5.0 — 2026-08-09

### Provider oficial Serpro

- fluxo `SERPRO::CERTIDAO_FEDERAL_RFB_PGFN`;
- modo API separado do runtime de navegador;
- OAuth2 `client_credentials`;
- cache e renovação de bearer token;
- bearer estático apenas para demonstração controlada;
- requisição oficial com `TipoContribuinte`, `ContribuinteConsulta`, `CodigoIdentificacao` e PDF;
- continuidade do status 7 com chave somente em memória;
- espera mínima configurada em 500 ms;
- tratamento dos status 1 a 15 e 99;
- CND e CPEND normalizadas;
- PDF base64 validado por assinatura `%PDF-`;
- raiz do CNPJ, emissão e validade validadas;
- upload com origem `API_OFICIAL`;
- `X-Request-Tag` sanitizado e limitado;
- provider desabilitado por padrão.

### Custo e execução

- chamadas HTTP 200 e 201 contabilizadas como bilhetáveis;
- custo estimado unitário recebido da definição do provider;
- custo acumulado entre retries na mesma execução;
- fallback recebe timeout, custo e moeda do próximo provider;
- worker publica modo e diagnóstico seguro dos fluxos.

### Modelo Federal

- acompanhamento Federal passa a existir somente na matriz;
- acompanhamentos antigos de filiais são inativados sem exclusão de documentos ou histórico.

### Pendências

- credenciais e contrato reais;
- custo vigente configurado pelo cliente;
- build Maven/npm/Docker no ambiente do usuário;
- PostgreSQL/Flyway real;
- chamada autorizada à API;
- amostras reais de CND e CPEND;
- testes automatizados e E2E.

## 0.4.0 — 2026-08-09

### Portais estaduais de São Paulo

- fluxo `SEFAZ_SP_PORTAL::CERTIDAO_SP_SEFAZ_NAO_INSCRITOS`;
- fluxo `PGE_SP_PORTAL::CERTIDAO_SP_PGE_DIVIDA_ATIVA`;
- CAPTCHA assistido pela sessão interativa existente;
- captura exclusiva de PDF;
- parsers específicos SEFAZ-SP e PGE-SP;
- validação de CNPJ e CNPJ base;
- SEFAZ-SP com janela operacional configurável;
- impedimento de emissão eletrônica direcionado a fallback/manual;
- PGE-SP consolidada por CNPJ base/matriz;
- certidões PGE de filiais antigas inativadas sem exclusão física;
- provider real mantido desabilitado por padrão.

### Segurança e integridade

- nenhum bypass de CAPTCHA;
- nenhuma classificação fiscal conclusiva sem documento quando exigido;
- PDF precisa possuir assinatura `%PDF-`;
- HTML não é convertido em certidão oficial;
- acompanhamentos inativos não aceitam nova consulta ou resultado manual.

### Pendências

- runtime autorizado da SEFAZ-SP e PGE-SP;
- amostras reais/anonimizadas de PDF;
- validação de seletores;
- fluxo administrativo de CPEN da PGE-SP;
- testes automatizados e E2E.

## 0.3.0 — 2026-08-09

### Automação Federal

- fluxo `FEDERAL_PORTAL::CERTIDAO_FEDERAL_RFB_PGFN` registrado no worker;
- navegação e preenchimento sem ocultação anti-bot;
- detecção de CAPTCHA e indisponibilidade;
- sessão interativa por CDP screencast e entrada remota;
- tickets HMAC temporários vinculados a usuário, intervenção, execução e sessão;
- retomada da execução na mesma página e sem incrementar tentativa;
- captura de bytes PDF por download, resposta HTTP, popup/blob e link de documento;
- rejeição de página HTML como substituto de documento oficial;
- validação de assinatura PDF;
- parser de CND, CPEND e certidão positiva;
- validação de CNPJ no documento;
- upload automático e resultado normalizado;
- provider mantido desabilitado até validação autorizada.

### Frontend

- modal de interação com o portal;
- mouse, rolagem, teclado e envio de texto;
- status de conexão e expiração;
- ação “Continuar automação” sem resolução manual paralela.

### Segurança

- proxy de sessão sem access log do ticket;
- ticket curto assinado com HMAC-SHA256;
- validação de atribuição do operador;
- nenhuma persistência de quadros do screencast;
- nenhum bypass de CAPTCHA.

### Pendências

- validação em runtime contra o portal Federal autorizado;
- amostras reais de CND e CPEND;
- testes automatizados, concorrência e E2E;
- providers SEFAZ-SP e PGE-SP.

## 0.2.0 — 2026-08-09

### Common

- fila PostgreSQL com aquisição atômica por `FOR UPDATE SKIP LOCKED`;
- lease renovável e recuperação atômica de leases expirados;
- idempotência com detecção de conflito de payload;
- retry com backoff;
- fallback entre providers;
- políticas por operação;
- provider pago com limite de custo;
- intervenção humana, expiração e retomada;
- worker Playwright com polling e heartbeat;
- upload de documentos pelo worker;
- validação de assinatura básica de arquivos;
- limpeza de arquivo quando a persistência imediata falha;
- auditoria e notificações ampliadas.

### Empresas

- domínio e APIs funcionais;
- estabelecimento matriz;
- filiais adicionais;
- Empresa 360;
- CNPJ, inscrições, regime e endereço.

### Certidões

- Centro de Certidões;
- Federal RFB/PGFN;
- SEFAZ-SP;
- PGE-SP;
- provider manual;
- estados fiscal/técnico separados;
- histórico;
- documentos;
- alertas;
- scheduler;
- políticas e fallback.

### Administração

- providers;
- políticas de aquisição;
- execuções;
- intervenções;
- auditoria;
- Console Técnica.

### Fora da versão

- fluxos reais de navegador;
- Serpro/InfoSimples reais;
- sessão remota para CAPTCHA;
- testes automatizados;
- runtime PostgreSQL/Docker validado neste ambiente de geração.

## 0.1.0 — 2026-08-09

- baseline on-premise;
- estrutura inicial backend, frontend e worker;
- documentação e orquestração.
