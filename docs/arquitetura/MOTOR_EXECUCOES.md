# Motor de execuções

## Objetivo

Executar integrações fora da requisição HTTP e permitir múltiplos workers sem processar o mesmo job
simultaneamente.

## Estados

```text
NA_FILA
RETRY_AGENDADO
EXECUTANDO
AGUARDANDO_HUMANO
AGUARDANDO_CAPTCHA
AGUARDANDO_AUTENTICACAO
SUCESSO
PARCIAL
FALHA
FONTE_INDISPONIVEL
CANCELADO
```

## Aquisição

O worker informa operações e providers suportados. O backend usa:

```sql
FOR UPDATE SKIP LOCKED
```

e atualiza uma execução em uma única operação, atribuindo:

- `lease_token`;
- `lease_ate`;
- `worker_id`;
- tentativa.

## Idempotência

Uma `idempotency_key` reutilizada só é aceita quando empresa, operação, provider e payload são os
mesmos. Caso contrário retorna conflito.

## Retry

Falha retryable agenda nova tentativa com backoff. Quando o limite termina, o lifecycle handler pode
criar o próximo provider da política.

## Lease expirado

A recuperação seleciona e atualiza até 100 execuções por transação usando CTE,
`FOR UPDATE SKIP LOCKED` e `RETURNING`.

## Limites

- não há broker externo;
- o PostgreSQL é a fila;
- uma única execução por worker nesta baseline;
- shutdown durante uma navegação pode perder o contexto; o lease será recuperado;
- testes de concorrência em PostgreSQL real permanecem pendentes.
