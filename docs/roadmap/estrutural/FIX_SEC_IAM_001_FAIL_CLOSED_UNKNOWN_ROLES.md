# FIX-SEC-IAM-001 — conversão JWT fail-closed

**Prioridade:** `P0`
**Status:** `RELEASED_FOR_EXECUTION`
**Origem:** finding `UNKNOWN_AUTHORITY_ACCEPTED` de `STR-SEC-IAM-001`
**Migration:** `NONE`

## Problema

`JwtAuthoritiesConverter` aceita qualquer texto presente em `realm_access.roles` ou
`resource_access.<client>.roles` e o transforma em `ROLE_*`. Uma claim inesperada pode, assim,
virar uma autoridade Spring mesmo sem existir em `Papeis`.

O contrato autorizado possui somente quatro papéis de aplicação e seus aliases conhecidos:
`ADMIN`, `OPERADOR`, `LEITOR` e `TECNICO`.

## Escopo

- tornar a normalização de papel fechada e tipada;
- aceitar somente aliases explicitamente mapeados;
- ignorar de forma segura papéis externos, vazios, malformados ou desconhecidos;
- deduplicar authorities vindas simultaneamente do realm e do client;
- preservar os quatro papéis e aliases atuais;
- não registrar claim bruta, token ou papel desconhecido em log;
- atualizar os testes focados e a prova do guard IAM.

## Critérios de aceite

1. aliases canônicos produzem exatamente a authority esperada;
2. papel desconhecido, inclusive já prefixado com `ROLE_`, não produz authority;
3. valores nulos, vazios, não string ou coleções malformadas falham fechados;
4. realm e client não geram duplicatas;
5. permissões existentes continuam derivadas de `Papeis`/`Permissoes`;
6. `iam_guard.py --generate` e o guard final terminam sem `UNKNOWN_AUTHORITY_ACCEPTED`;
7. testes de segurança e `mvn test-compile` passam;
8. nenhuma alteração em realm, migration, endpoint, POM ou configuração de autenticação.

## Fora do escopo

Administração de usuários, mudança de papéis de produto, Keycloak real, novo claim, migration,
bypass de autenticação ou compatibilidade permissiva com papel desconhecido.
