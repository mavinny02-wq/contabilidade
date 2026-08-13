# Contabilidade

Plataforma interna de operações fiscais e contábeis em português, preparada para execução
**on-premise first** e migração futura para nuvem.

**Versão atual:** `0.5.1`

## Inicialização

Existe um único BAT oficial na raiz:

```text
START_CONTABILIDADE.bat
```

### Desenvolvimento

Duplo clique no arquivo ou execute:

```powershell
.\START_CONTABILIDADE.bat dev
```

O fluxo compila backend, frontend e automation worker no Windows, cria imagens runtime-only e inicia
somente PostgreSQL, backend, worker e frontend. Como o modo dev desabilita autenticação, Keycloak e o
bootstrap do banco Keycloak não são iniciados.

Aplicação:

```text
http://localhost:8088
```

### Produção on-premise

```powershell
.\START_CONTABILIDADE.bat onpremise pull digest
```

O modo on-premise não executa Maven, npm ou `docker build` no servidor. Ele usa imagens previamente
publicadas e inicia PostgreSQL, bootstrap, Keycloak, backend, worker e frontend em sequência.

### Manutenção manual de memória

```powershell
.\START_CONTABILIDADE.bat memoria
```

Esse utilitário nunca é executado automaticamente.

## Principais capacidades

### API oficial Serpro Consulta CND

- provider `SERPRO::CERTIDAO_FEDERAL_RFB_PGFN`;
- OAuth2 `client_credentials` com cache e renovação de bearer token;
- suporte controlado a bearer estático para demonstração;
- requisição oficial de pessoa jurídica com PDF;
- continuação de `Status = 7` sem persistir a chave;
- CND e CPEND normalizadas separadamente;
- validação do PDF, datas e raiz do CNPJ;
- contagem estimada de chamadas bilhetáveis;
- custo acumulado mesmo quando ocorre retry;
- execução em modo API, sem iniciar browser para esse fluxo;
- provider desabilitado até configuração e validação autorizada.

### Portais assistidos preservados

- Portal Federal RFB/PGFN;
- SEFAZ-SP eCND;
- PGE-SP e-CRDA;
- sessão humana para CAPTCHA;
- captura exclusiva de PDF;
- providers desabilitados por padrão.

### Common e Centro de Certidões

- Java 21 + Spring Boot;
- React + TypeScript;
- PostgreSQL + Flyway;
- Keycloak/OAuth2/JWT;
- fila com lease, retry, idempotência, custo e fallback;
- empresas, matriz e filiais;
- documentos e histórico;
- políticas de providers;
- intervenções e sessão interativa;
- alertas, auditoria e Console Técnica;
- Centro de Certidões Federal, SEFAZ-SP e PGE-SP.

## Limites explícitos

- o provider Serpro continua desabilitado até credenciais e custo vigente serem configurados;
- a implementação não substitui contrato, faturamento ou homologação do Serpro;
- os portais Playwright continuam sujeitos a validação autorizada de seletores, CAPTCHA e PDFs;
- não existe bypass de CAPTCHA;
- InfoSimples permanece apenas como definição de provider;
- chamadas fiscais reais não fazem parte do startup ou dos testes locais padrão.

## Preflight do provider oficial

```powershell
.\scripts\validar-serpro.ps1
```

## Estrutura

```text
backend/             domínio, APIs, fila e certidões
frontend/            aplicação web em pt-BR
automation-worker/   providers API e portais assistidos
infra/               Keycloak, PostgreSQL e seccomp
scripts/             lógica interna de build, startup, validação e backup
docs/                documentação canônica
```
