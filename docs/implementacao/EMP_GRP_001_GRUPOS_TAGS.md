# EMP-GRP-001 — Grupos e tags de empresas

## Objetivo

Permitir que a empresa organize sua carteira internamente sem alterar o cadastro fiscal, usando um
grupo opcional e até vinte tags por empresa.

## Contrato

- `PUT /api/empresas/{empresaId}/classificacao`;
- permissão `EMPRESA_EDITAR`;
- grupo opcional com até 100 caracteres;
- até 20 tags, cada uma com até 60 caracteres;
- duplicidades são removidas sem diferenciar maiúsculas e minúsculas;
- razão social, CNPJ, regime e demais dados fiscais não são alterados pelo endpoint.

## Persistência

A migration `V9__empresa_grupos_tags.sql`:

- adiciona `empresas.grupo`;
- cria `empresa_tags` com FK para `empresas` e `ON DELETE CASCADE`;
- impede duplicidade case-insensitive por empresa;
- adiciona índice de busca por tag normalizada.

## Busca e interface

A busca de empresas passa a considerar:

- razão social;
- nome fantasia;
- CNPJ;
- grupo;
- tag.

A Empresa 360 mostra a classificação em card próprio e oferece edição separada do formulário
fiscal. A listagem apresenta grupo e uma amostra das tags.

## Segurança e auditoria

- não cria nova permissão;
- não registra a lista de tags nem o grupo na auditoria;
- o evento `EMPRESA_CLASSIFICACAO_ATUALIZADA` guarda apenas presença de grupo e quantidade de tags;
- nenhuma integração externa é acionada.

## Provas pendentes

- Maven completo e aplicação da V9;
- frontend i18n, typecheck e build;
- criação, edição, remoção e deduplicação de tags;
- busca por grupo e tag;
- tentativa com mais de 20 tags e tag acima de 60 caracteres;
- usuário sem `EMPRESA_EDITAR`;
- validação de que o cadastro fiscal permanece inalterado.
