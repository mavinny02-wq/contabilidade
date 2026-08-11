# CRT-FAT-001 — Reconciliação de faturas de providers

## Objetivo

Comparar os valores faturados pelo provider com os custos estimados já registrados nas execuções,
sem consultar APIs externas e sem misturar moedas.

## Implementação

- migration `V11__faturas_provedor.sql`;
- registro único por provider, competência e moeda;
- valor faturado, referência e observação;
- cálculo do custo estimado pela soma de `execucoes_integracao.custo_estimado` no mesmo período,
  provider e moeda;
- diferença classificada como:
  - `SEM_DIVERGENCIA`;
  - `ACIMA_ESTIMADO`;
  - `ABAIXO_ESTIMADO`;
- tolerância operacional de `0,01` da moeda;
- endpoints:
  - `GET /api/integracoes/faturas`;
  - `POST /api/integracoes/faturas`;
- página administrativa com filtro e formulário de competência.

## Segurança e consistência

- leitura exige `INTEGRACAO_LER`;
- escrita exige `INTEGRACAO_EDITAR`;
- nenhuma chamada ao provider;
- nenhuma credencial, payload, protocolo ou documento é retornado;
- moedas são agregadas separadamente;
- período máximo de 366 dias;
- auditoria não registra valores monetários nem observação textual;
- um novo POST com a mesma chave atualiza a competência existente.

## Provas runtime pendentes

- aplicação da V11;
- competências sem custo e com múltiplas execuções;
- valores acima, abaixo e dentro da tolerância;
- isolamento por provider e moeda;
- atualização idempotente da mesma competência;
- período inválido e excedido;
- provider inexistente;
- autorização de leitura/escrita;
- auditoria sem valor ou texto da fatura;
- i18n, typecheck e build do frontend.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
