# VAL-STAB-BACKEND-PG-002 — backend verify com PostgreSQL controlado

**Status:** `PREPARED_NOT_RELEASED`

## Objetivo

Fechar apenas a lacuna de `VAL-STAB-BACKEND-001`: executar a suíte Maven com PostgreSQL disponível.

## Ambiente

- Java 21;
- PostgreSQL local/efêmero compatível;
- banco, usuário e senha exclusivamente sintéticos;
- profile `local` e segurança desabilitada quando exigido pelo teste;
- providers externos apontados para destino local inerte ou desabilitados.

## Execução

1. criar banco dedicado e descartável;
2. executar `cd backend && mvn -B clean verify`;
3. registrar totais, Flyway, exit code e primeira causa raiz;
4. remover somente recursos temporários criados pela task.

## Proibições

- não alterar produção, testes, migrations, POM ou configuração;
- não usar PostgreSQL/dados do usuário;
- não chamar provider fiscal;
- não converter limitação de ambiente em falha de produto.

## Aceite

`BUILD SUCCESS`, todos os testes verdes, Flyway V1–V12 aplicado e
`docs/testing/runs/VAL_STAB_BACKEND_PG_002.md` integrado.
