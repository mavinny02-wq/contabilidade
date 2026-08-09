# Contabilidade

Plataforma interna de operações fiscais e contábeis em português, preparada para execução
**on-premise first** e migração futura para nuvem.

**Versão do pacote:** `0.3.0`

## Conteúdo desta versão

### Portal Federal assistido

- fluxo Playwright para `CERTIDAO_FEDERAL_RFB_PGFN`;
- rota pública de pessoa jurídica da Receita Federal;
- preenchimento de CNPJ;
- detecção de CAPTCHA;
- sessão interativa temporária dentro da aplicação;
- retomada na mesma página e no mesmo lease lógico;
- captura e validação de bytes do PDF oficial;
- rejeição de página HTML impressa como substituto de certidão;
- parser de CND/CPEND/positiva;
- extração de CNPJ, emissão, validade e código de controle;
- upload automático do documento;
- resultado normalizado no Centro de Certidões;
- classificação explícita de indisponibilidade, timeout e portal alterado.


### Common operacional

- Java 21 + Spring Boot;
- React + TypeScript;
- PostgreSQL + Flyway;
- Keycloak/OAuth2/JWT;
- Catálogo de Permissões no backend;
- i18n somente `pt-BR`;
- auditoria, notificações e `correlationId`;
- storage local abstrato para documentos;
- fila PostgreSQL com lease, retry, idempotência, prioridade e fallback;
- políticas de aquisição por operação;
- intervenções humanas;
- busca global;
- Console Técnica;
- worker Playwright isolado.

### Empresas

- empresa e estabelecimento matriz;
- filiais adicionais;
- CNPJ validado;
- regime tributário, CNAE, inscrições e endereço;
- listagem, busca, edição e inativação da empresa;
- Empresa 360.

### Centro de Certidões

- Federal RFB/PGFN;
- SEFAZ-SP — débitos não inscritos;
- PGE-SP — dívida ativa;
- visão por empresa ou consolidada;
- estados fiscal e técnico separados;
- solicitação individual e em lote;
- provider configurável;
- política de prioridade, intervenção e fallback pago;
- registro manual com documento;
- histórico;
- alertas e agendamento de renovação;
- custo/protocolo disponíveis no motor de execução.

## Limites explícitos

Esta versão registra somente o fluxo real do **portal Federal**. SEFAZ-SP e PGE-SP continuam sem
fluxos Playwright. Além disso:

- `FEDERAL_PORTAL` permanece desabilitado por padrão até validação autorizada no ambiente do cliente;
- Serpro e InfoSimples continuam definidos, mas sem implementação e credenciais;
- CAPTCHA é resolvido por um operador em sessão temporária; não há bypass;
- os seletores, o download e o parser ainda precisam de validação contra o portal e documentos reais;
- o provider `MANUAL` continua disponível como contingência;
- lockfiles npm devem ser gerados no ambiente com acesso ao registry;
- testes automatizados não foram criados nem executados nesta entrega.

## Instalação no repositório existente

Leia [INSTRUCOES_INTEGRACAO.md](INSTRUCOES_INTEGRACAO.md) antes de substituir arquivos.

Depois da integração:

```powershell
Set-Location "C:\work\contabilidade"

.\scripts\gerar-lockfiles.ps1
.\scripts\validar.ps1
```

Somente depois de uma validação verde:

```powershell
git add .
git commit -m "feat: implementa portal federal assistido v0.3.0"
git push origin main
```

## Execução local

```powershell
Copy-Item .env.example .env
.\scripts\iniciar-dev.ps1
```

Aplicação:

```text
http://localhost:8088
```

O realm de desenvolvimento inclui:

```text
admin@contabilidade.local
Admin123!
```

Essa credencial não pode ser usada em produção.

## Estrutura

```text
backend/             domínio, APIs, fila e certidões
frontend/            aplicação web em pt-BR
automation-worker/   runtime Playwright e fluxo Federal assistido
infra/               Keycloak, PostgreSQL e seccomp
scripts/             validação, operação e backup
docs/                documentação canônica
```
