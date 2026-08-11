# CRT-DASH-001 — Dashboard gerencial de certidões

## Objetivo

Consolidar no Dashboard uma visão operacional das certidões ativas sem reconstruir regras fiscais no
frontend e sem carregar toda a base em uma única consulta.

## Backend

O endpoint protegido:

```text
GET /api/certidoes/dashboard-gerencial
```

usa `CERTIDAO_LER` e retorna:

- total de acompanhamentos ativos;
- quantidade efetivamente analisada;
- indicador de resultado parcial;
- totais regular, atenção e em andamento;
- distribuição por tipo;
- distribuição por status exibido;
- vencimentos nos próximos 30 dias;
- acompanhamentos sem validade;
- última atualização observada.

O status é calculado por `CertidaoAcompanhamento.statusExibicao`, a mesma regra autoritativa usada no
Centro de Certidões.

## Escalabilidade

A leitura usa os cursores bounded já existentes:

- IDs ativos em lotes ordenados;
- carregamento somente do lote atual;
- limite máximo configurável;
- resposta `parcial=true` quando a base ultrapassa o teto.

Configuração:

```text
APP_CERTIFICATE_DASHBOARD_BATCH_SIZE=1000
APP_CERTIFICATE_DASHBOARD_MAX_ROWS=100000
```

O lote aceita de 10 a 5.000 itens e o teto de análise aceita até 500.000 registros.

## Frontend

O Dashboard mostra, apenas para usuários com `CERTIDAO_LER`:

- métricas gerenciais;
- distribuição por tipo com barras proporcionais;
- distribuição por status com badges;
- aviso de amostra limitada;
- última atualização observada;
- link para o Centro de Certidões.

Todos os textos usam catálogo i18n pt-BR.

## Segurança e domínio

- nenhuma chamada a provider;
- nenhum documento ou payload fiscal é retornado;
- nenhuma migration;
- nenhuma regra de regularidade é duplicada no frontend;
- a visão parcial é identificada explicitamente e não é apresentada como total completo.

## Validação realizada

- revisão estática do cursor, limites e classificação agregada;
- revisão da permissão `CERTIDAO_LER`;
- revisão do bundle i18n e dos estados responsivos;
- nenhuma operação externa executada.

## Validação runtime pendente

- Maven completo;
- i18n, typecheck e build frontend;
- base vazia;
- base abaixo e acima do limite;
- status vencido/próximo do vencimento;
- usuário sem `CERTIDAO_LER`;
- consistência entre números do Dashboard e Centro de Certidões.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
