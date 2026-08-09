# Validação operacional da versão 0.2.0

Gerado em UTC: 2026-08-09T06:08:31.036878+00:00

## Resultado

**PACOTE ESTRUTURALMENTE VALIDADO, COM BUILD DE DEPENDÊNCIAS E RUNTIME AINDA PENDENTES NO AMBIENTE DO USUÁRIO.**

Nenhum teste automatizado foi criado ou executado nesta entrega.

## Validações executadas e aprovadas

| Verificação | Resultado | Limite da evidência |
|---|---|---|
| Java 21 — compilação estrutural de 100 fontes | OK | Compilação contra stubs locais das APIs Spring/JPA/Jackson; não substitui Maven com dependências reais |
| Frontend TypeScript — 43 fontes | OK | Compilação estrutural contra declarações locais; não substitui `npm install` + build Vite real |
| Worker TypeScript — 9 fontes | OK | Compilação estrutural contra declarações locais; não substitui build com Playwright instalado |
| i18n `pt-BR` | OK | 41 arquivos e 81 entradas dinâmicas verificadas |
| JSON | OK | Todos os arquivos parseados |
| YAML | OK | Todos os arquivos parseados sintaticamente |
| XML/POM | OK | XML bem formado |
| Scripts shell | OK | `bash -n` |
| Chaves de erro backend | OK | 47 chaves usadas possuem mensagem em `messages_pt_BR.properties` |
| Catálogo de permissões | OK | 17 permissões idênticas entre backend e frontend |
| Migrations V1/V2 | OK | Hashes idênticos à baseline v0.1.0 |
| Migrations novas | PRESENTES | V3 Common operacional e V4 Centro de Certidões |
| Higiene de texto | OK | UTF-8, newline final e ausência de trailing whitespace |
| Artefatos gerados | OK | Sem `node_modules`, `target`, `dist` ou `.tsbuildinfo` no pacote |

Os únicos avisos da compilação Java estrutural vieram das classes stub temporárias usadas pela
validação, não do código do projeto.

## Validações que não puderam ser executadas neste ambiente

| Verificação | Motivo |
|---|---|
| `mvn -DskipTests compile` | Maven não está instalado e o ambiente não possui resolução DNS externa para baixar Maven/dependências |
| `npm install` / lockfiles | Registry npm inacessível por falha de resolução DNS; nenhum lockfile foi inventado |
| `npm run build` com dependências reais | Depende da instalação dos pacotes |
| `docker compose config` e subida dos serviços | Docker não está instalado neste ambiente |
| PostgreSQL + Flyway real | Depende do ambiente Docker/PostgreSQL |
| Keycloak/OIDC real | Depende dos containers em execução |
| Playwright/Chromium real | Depende da imagem e pacote Playwright reais |
| Upload/download em runtime | Depende da aplicação e storage em execução |
| Concorrência de leasing/fallback | Depende de PostgreSQL real e validação dedicada |
| Backup e restauração | Depende do ambiente on-premise real |

## Passos obrigatórios após aplicar o pacote

```powershell
Set-Location "C:\work\contabilidade"

.\scripts\gerar-lockfiles.ps1
.\scripts\validar.ps1
.\scripts\iniciar-dev.ps1
.\scripts\status.ps1
```

Depois valide manualmente:

1. cadastro e edição de empresa;
2. cadastro de filial;
3. upload e download de documento;
4. inicialização automática das três certidões por estabelecimento aplicável;
5. resultado manual com documento;
6. histórico de certidão;
7. políticas de providers;
8. execuções e intervenções;
9. notificações;
10. Console Técnica.

## Provas explicitamente pendentes

- `BACKEND_BUILD_REAL_PENDENTE`;
- `FRONTEND_BUILD_REAL_PENDENTE`;
- `WORKER_BUILD_REAL_PENDENTE`;
- `POSTGRESQL_FLYWAY_RUNTIME_PENDENTE`;
- `KEYCLOAK_RUNTIME_PENDENTE`;
- `PLAYWRIGHT_RUNTIME_PENDENTE`;
- `BACKUP_RESTORE_PENDENTE`;
- `TESTES_AUTOMATIZADOS_PENDENTES`;
- `E2E_PENDENTE`.
