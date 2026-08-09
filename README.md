# Contabilidade

Plataforma interna de operações fiscais e contábeis em português, preparada para execução
**on-premise first** e migração futura para nuvem.

**Versão do pacote:** `0.5.0`

## Destaques desta versão

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
- testes automatizados e E2E permanecem para tasks separadas;
- build Maven, Docker e consulta Serpro real devem ser executados no ambiente do usuário.

## Aplicação da atualização incremental

Extraia o ZIP incremental diretamente na raiz do projeto e permita sobrescrever os arquivos
existentes. O pacote não contém pasta wrapper nem scripts de patch.

```powershell
Set-Location "C:\work\contabilidade"
.\scripts\gerar-lockfiles.ps1
.\scripts\validar.ps1
```

Suba o ambiente:

```powershell
Copy-Item .env.example .env
.\scripts\iniciar-dev.ps1
```

Aplicação:

```text
http://localhost:8088
```

Preflight do provider oficial:

```powershell
.\scripts\validar-serpro.ps1
```

## Estrutura

```text
backend/             domínio, APIs, fila e certidões
frontend/            aplicação web em pt-BR
automation-worker/   providers API e portais assistidos
infra/               Keycloak, PostgreSQL e seccomp
scripts/             validação, operação e backup
docs/                documentação canônica
```
