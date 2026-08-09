# Validação da versão 0.5.0

**Data:** 2026-08-09
**Resultado:** `APROVADA ESTATICAMENTE / RUNTIME EXTERNO PENDENTE`

## Escopo validado

| Verificação | Resultado |
|---|---:|
| TypeScript parse/transpile — frontend + worker | OK — 60 fontes |
| Worker TypeScript semântico com tipos locais controlados | OK |
| Serpro TypeScript semântico estrito | OK |
| i18n pt-BR | OK — 42 fontes e 86 entradas dinâmicas |
| Java 21 — parse completo | OK — 102 fontes |
| Java — domínio de custo e aplicabilidade Federal | OK |
| JSON | OK — 12 arquivos |
| YAML | OK — 7 arquivos |
| XML | OK — 2 arquivos |
| imports relativos TypeScript | OK — 208 imports |
| scripts shell | OK — 4 arquivos |
| Flyway | OK — V1 a V7 |
| migrations históricas V1–V6 | imutáveis |
| migration V7 | sem DROP, DELETE ou TRUNCATE |

## Cenários temporários executados contra mock local

Os harnesses foram executados fora do repositório e não foram incluídos como testes permanentes:

- `Status 7 → Status 1` com chave apenas em memória;
- CND negativa e upload PDF;
- CPEND (`TipoCertidao = 2`);
- `Status 3` como resultado incompleto;
- `Status 6` como fonte indisponível;
- falha de storage preservando custo estimado;
- OAuth2 `client_credentials`, Basic auth, cache e invalidação;
- renovação de token após HTTP 401;
- bearer estático recusado quando o opt-in está desabilitado;
- custo de duas chamadas 200 acumulado corretamente.

## Dependências npm

A geração dos lockfiles não pôde ser concluída neste ambiente. O registry interno retornou HTTP 404
para `@types/node@22.20.1`. Isso é uma limitação do registry disponível nesta sessão, não uma prova de
falha do pacote no registry público.

Por isso, os lockfiles devem ser gerados no ambiente do usuário com:

```powershell
.\scripts\gerar-lockfiles.ps1
```

## Não executado neste ambiente

- Maven/Spring Boot completo;
- Docker Compose;
- PostgreSQL e Flyway em banco real;
- Keycloak;
- browser Playwright real;
- autenticação Serpro real;
- Consulta CND real;
- faturamento real;
- amostras oficiais de CND e CPEND;
- testes automatizados permanentes e E2E.

## Gate de integração

A versão só deve ser considerada operacional após:

1. geração dos lockfiles;
2. `scripts/validar.ps1` verde;
3. Compose e migrations verdes;
4. preflight com credenciais;
5. uma consulta autorizada;
6. conferência humana do PDF e do custo;
7. preservação da execução como evidência.
