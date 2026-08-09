# Governança da documentação

**Classificação:** CANÔNICO_ATIVO

## Autoridade

O estado atual é resolvido nesta ordem:

1. Registro de Itens do Roadmap;
2. backlog do domínio;
3. decisão ativa;
4. Board de Orquestração;
5. Histórico de Entregas;
6. evidência histórica imutável.

Código e configuração executável são autoridade superior sobre o comportamento realmente
implementado.

## Atualização

Uma task comum altera apenas seu código, um backlog de domínio e, quando necessário, uma evidência
curta. Registro, roadmap global, board e histórico são reconciliados de forma serial após os merges.

## Histórico

Artefatos concluídos vão para `docs/historico/YYYY-MM/` e não são reescritos para representar
estados futuros.

## Benchmark

Veri e Contabilizei são referências de capacidade. Marketing público não comprova algoritmo,
integração, regra ou implementação interna. Observações de trial autorizado devem registrar data,
contexto, passos, resultado e incerteza.
