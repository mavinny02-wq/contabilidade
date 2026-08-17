# STR-SEC-IAM-001 — matriz e guard de autorização

## Estado

`RELEASED_FOR_EXECUTION` pela `CONTABILIDADE_FAST_LANE_WAVE_009`.

## Objetivo

Criar inventário determinístico e guard local para detectar drift entre papéis, permissões,
conversão JWT, rotas públicas/protegidas e configuração do realm, sem depender de Keycloak real.

## Fontes read-only

- `backend/**/common/security/**`;
- anotações e expressões de autorização dos controllers;
- `infra/keycloak/realm-*.json`;
- catálogo frontend de permissões, quando aplicável.

## Owner

`scripts/security/iam/**`, inventário gerado, fixtures, testes e
`docs/implementacao/STR_SEC_IAM_001_RESULT.md`.

Código de produção, realm, migrations e dependências permanecem read-only. Drift encontrado é
classificado e tratado por successor.

## Guard obrigatório

- IDs de papel/permissão únicos e estáveis;
- permissões usadas existem no catálogo;
- papéis do realm e backend possuem mapeamento explícito;
- rotas públicas pertencem a allowlist mínima;
- endpoints protegidos não ficam públicos por omissão;
- worker token não concede autoridade de usuário;
- conversão JWT não aceita claims inesperados como privilégio;
- modo sem autenticação é permitido somente pelo contrato dev;
- inventário e saída são determinísticos;
- findings não expõem token, claim bruto ou PII.

## Testes

Fixtures sintéticas cobrem papel ausente, permissão órfã, rota pública nova, autoridade desconhecida,
claim malformada, duplicidade e divergência de realm.

`STR_SEC_IAM_001_RELEASED`
