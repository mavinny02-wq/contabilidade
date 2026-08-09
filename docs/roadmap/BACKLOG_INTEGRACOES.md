# Backlog Integrações

## Definições presentes

- `FEDERAL_PORTAL`;
- `SEFAZ_SP_PORTAL`;
- `PGE_SP_PORTAL`;
- `SERPRO`;
- `INFOSIMPLES`;
- `MANUAL`.

Apenas `MANUAL` inicia habilitado.

## Regras

- providers pagos dependem de prioridade/fallback;
- custo máximo pode bloquear provider;
- custo desconhecido é bloqueado quando há limite;
- moeda incompatível é bloqueada;
- portal assistido/manual dependem de intervenção permitida;
- segredo é referência, não valor.

## Antes de ativar provider real

- contrato;
- termos;
- credencial;
- ambiente de teste;
- rate limit;
- custo;
- idempotência;
- tratamento de indisponibilidade;
- evidência;
- segurança.
