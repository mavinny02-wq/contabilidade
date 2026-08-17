# FIX-TECH-AUTH-001 — resultado

**ITEM:** `FIX-TECH-AUTH-001`  
**Baseline:** `eca3cd61f9ea11770ca5c31bf985906dec0954bb` (`latest main` disponível no checkout)  
**Status:** `PASS`  
**Commit de implementação:** `0a7d4f06fedfdf2645816c58cfb4ee4bfd2beee5`  
**Pull request:** `NOT_CREATED_ENVIRONMENT_LIMITATION` — `make_pr` não está disponível e o GitHub CLI não possui autenticação

## Owners alterados

- tratamento global de `AccessDeniedException` com `ApiError`, HTTP 403, código
  `ACESSO_NEGADO`, mensagem segura e correlation ID;
- mensagem localizada `erros.acessoNegado`;
- testes focados do advice e da autorização da Console Técnica;
- este resultado exato.

Não foram alterados controllers, expressões `@PreAuthorize`, realm, conversor JWT, endpoints, POM
ou migrations.

## Locks preservados

- `LOCK-DATA-001`: testes usam apenas identidades e valores sintéticos, sem credenciais ou dados
  reais;
- `LOCK-EVID-001`: foi executada somente a prova focada liberada pelo launcher, além da validação
  estrutural;
- `LOCK-TEST-001`: a falha comprovada foi tratada como `PRODUCT_REGRESSION`, pois a negação de
  method security caía no handler genérico e retornava 500.

## Comandos e resultados

- `java -version`: `PASS`, OpenJDK 21.0.2;
- `cd backend && mvn -B -Dtest=ConsoleTecnicaAuthorizationTest,TratadorGlobalExcecoesTest test`:
  `PASS`, 5 testes, 0 falhas, 0 erros, 0 ignorados;
- `cd backend && mvn -B -DskipTests test-compile`: `PASS`;
- `git diff --check`: `PASS`.

## Cobertura da prova focada

- acesso com `CONSOLE_TECNICA_LER` permanece HTTP 200;
- usuário autenticado sem a authority recebe HTTP 403 e corpo `ACESSO_NEGADO` correlacionado;
- autenticação ausente permanece HTTP 401 na security chain;
- advice direto não expõe o detalhe da exceção de autorização;
- exceção inesperada permanece HTTP 500/`ERRO_INTERNO`.

## Limitações e provas pendentes

Não há blocker identificado. A validação comprova os testes focados e a compilação em Java 21; não
constitui prova de runtime externo, navegador, PostgreSQL real, Windows ou provider fiscal.
