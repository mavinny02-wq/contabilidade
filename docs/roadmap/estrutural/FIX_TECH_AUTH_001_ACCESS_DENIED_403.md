# FIX-TECH-AUTH-001 — negação de autorização deve retornar HTTP 403

**Status:** `RELEASED_FOR_EXECUTION`  
**Origem:** `VAL-TECH-CONSOLE-CURRENT-001`  
**Owner:** tratamento global de autorização, mensagens e testes focados  
**Migration:** `NONE`

## Problema comprovado

`GET /api/console-tecnica/resumo` permite o usuário com `CONSOLE_TECNICA_LER`, mas a negação por
method security lança `AccessDeniedException` e chega ao handler genérico. O resultado atual é
`ERRO_INTERNO`/HTTP 500, embora o contrato correto seja HTTP 403.

## Objetivo

Tratar autorização negada como resposta segura, estável e correlacionável sem transformar falha de
autorização em erro interno e sem enfraquecer qualquer regra de acesso.

## Escopo permitido

- `backend/src/main/java/br/com/contabilidade/common/error/TratadorGlobalExcecoes.java`;
- mensagem backend específica de acesso negado;
- testes focados do advice e `ConsoleTecnicaAuthorizationTest`;
- `docs/implementacao/FIX_TECH_AUTH_001_RESULT.md`.

Controllers, expressões `@PreAuthorize`, realm, JWT converter, endpoints, POM e migrations são
somente leitura.

## Aceite

1. `AccessDeniedException` originada antes ou durante method security retorna HTTP `403`.
2. O corpo usa `ApiError`, código técnico estável `ACESSO_NEGADO`, mensagem segura e correlation ID.
3. O corpo não contém stack trace, authorities, claims, token, usuário ou detalhes internos.
4. Acesso permitido à Console Técnica continua passando.
5. Usuário sem permissão recebe 403; não recebe 200, 401 ou 500.
6. Exceções realmente inesperadas continuam mapeadas para 500.
7. Autenticação ausente continua sob o contrato já existente da security chain; a task não troca
   401 por 403.
8. Testes cobrem advice direto, method security permitido/negado e correlation ID.
9. Nenhuma regra de autorização é removida, ampliada ou contornada.

## Validação

```text
Java 21
mvn -B -Dtest=ConsoleTecnicaAuthorizationTest,TratadorGlobalExcecoesTest test
mvn -B -DskipTests test-compile
git diff --check
```

`FIX_TECH_AUTH_001_READY`
