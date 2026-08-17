# VAL-TECH-CONSOLE-CURRENT-001 — contrato atual da Console Técnica

**Prioridade:** `P1`
**Status:** `RELEASED_FOR_EXECUTION`
**Tipo:** validação/correção de testes; produto read-only
**Migration:** `NONE`

## Contexto

Uma task posterior à Wave 009 recebeu endpoints de outra baseline (`/api/system/**` e
`/api/technical/**`) e foi corretamente classificada como `BASELINE_DRIFT`. A autoridade atual é:

- frontend `ConsoleTecnicaPage.tsx`;
- `GET /api/console-tecnica/resumo`;
- `GET /api/console-tecnica/storage/reconciliacao`;
- controllers de configuração segura e histórico de heartbeat sob o mesmo módulo atual.

## Objetivo

Provar o contrato realmente presente no HEAD e capturar stack trace apenas se um endpoint atual
falhar. A task não deve criar endpoints para satisfazer uma especificação obsoleta.

## Cenários mínimos

- resumo saudável, degradado e indisponível;
- storage saudável, parcial e divergente;
- worker sem heartbeat, atrasado, expirado e saudável;
- configuração efetiva sem revelar valor sensível;
- histórico de heartbeat bounded;
- autorização permitida e negada;
- erro técnico com correlation ID e sem stack trace/PII no frontend;
- frontend loading, retry e erro da reconciliação;
- alinhamento call site ↔ usage map ↔ OpenAPI.

## Critérios de aceite

1. testes backend focados passam com PostgreSQL controlado quando necessário;
2. testes frontend usam Node 24 e exercitam os caminhos atuais;
3. nenhum request para `/api/system/**` ou `/api/technical/**` é introduzido;
4. erro HTTP 500 em endpoint atual exige stack trace e classificação, não mock de sucesso;
5. consumer-contract e OpenAPI guards passam;
6. produto, migrations, POM e lockfiles permanecem read-only;
7. resultado informa claramente `PASS`, `PRODUCT_REGRESSION`, `TEST_CONTRACT_DRIFT` ou
   `ENVIRONMENT_LIMITATION`.

## Fora do escopo

Nova Console Técnica, redesign, endpoint legado, provider fiscal, dado real, Keycloak real ou
correção de produto dentro da própria task de validação.
