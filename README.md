# Contabilidade

Plataforma interna de operações fiscais e contábeis em português, preparada para execução
**on-premise first** e migração futura para nuvem.

**Versão do pacote:** `0.4.0`

## Destaques desta versão

### Portais estaduais de São Paulo

- fluxo Playwright assistido para a eCND da SEFAZ-SP;
- fluxo Playwright assistido para a e-CRDA da PGE-SP;
- CNPJ completo para SEFAZ-SP;
- CNPJ base e um único acompanhamento ativo por empresa para PGE-SP;
- CAPTCHA com sessão interativa humana já existente;
- captura exclusiva de bytes PDF;
- parsers separados por órgão;
- validação de CNPJ/CNPJ base;
- upload automático e resultado normalizado;
- bloqueio funcional quando o portal não emite certidão eletrônica;
- providers mantidos desabilitados até validação autorizada.

### Portal Federal

- provider assistido RFB/PGFN preservado da versão 0.3.0;
- preenchimento de CNPJ;
- CAPTCHA humano;
- captura e parser de PDF.

### Common e Centro de Certidões

- Java 21 + Spring Boot;
- React + TypeScript;
- PostgreSQL + Flyway;
- Keycloak/OAuth2/JWT;
- fila com lease, retry, idempotência e fallback;
- empresas, matriz e filiais;
- documentos e histórico;
- políticas de providers;
- intervenções e sessão interativa;
- alertas, auditoria e Console Técnica;
- Centro de Certidões Federal, SEFAZ-SP e PGE-SP.

## Limites explícitos

- os três providers de portal permanecem desabilitados por padrão;
- seletores, CAPTCHA e PDFs precisam de validação no ambiente real autorizado;
- não existe bypass de CAPTCHA;
- a emissão administrativa de certidão positiva com efeitos de negativa da PGE-SP continua manual;
- quando a SEFAZ-SP não emite eletronicamente por impedimentos, o sistema usa fallback/manual;
- Serpro e InfoSimples continuam definidos, mas sem credenciais/implementação real;
- testes automatizados e E2E permanecem para tasks separadas.

## Instalação no repositório existente

Leia [INSTRUCOES_INTEGRACAO.md](INSTRUCOES_INTEGRACAO.md).

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

Preflight dos portais:

```powershell
.\scripts\validar-portal-federal.ps1
.\scripts\validar-portais-sp.ps1
```

## Estrutura

```text
backend/             domínio, APIs, fila e certidões
frontend/            aplicação web em pt-BR
automation-worker/   providers Federal, SEFAZ-SP e PGE-SP
infra/               Keycloak, PostgreSQL e seccomp
scripts/             validação, operação e backup
docs/                documentação canônica
```
