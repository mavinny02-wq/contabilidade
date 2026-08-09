# Contabilidade

Plataforma interna de operações fiscais e contábeis em português, preparada para execução
**on-premise first** e migração futura para nuvem.

**Versão do pacote:** `0.2.0`

## Conteúdo desta versão

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

Esta versão **não contém automações reais dos portais** Federal, SEFAZ-SP ou PGE-SP. O worker está
preparado, mas não registra nenhum `FluxoPortal`. Portanto:

- o provider `MANUAL` é o caminho funcional inicial;
- Serpro e InfoSimples são definições desabilitadas, sem credenciais;
- os providers de portal são definições desabilitadas;
- não existe ainda handoff visual de uma sessão de navegador ao operador;
- CAPTCHA não é burlado;
- lockfiles npm devem ser gerados no ambiente com acesso ao registry;
- testes automatizados não foram criados nem executados.

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
git commit -m "feat: implementa common operacional e centro de certidoes v0.2.0"
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
automation-worker/   runtime Playwright, sem fluxos reais
infra/               Keycloak, PostgreSQL e seccomp
scripts/             validação, operação e backup
docs/                documentação canônica
```
