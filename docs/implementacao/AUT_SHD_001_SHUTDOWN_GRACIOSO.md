# AUT-SHD-001 — Shutdown gracioso do automation worker

## Objetivo

Evitar que uma atualização, reinício de container ou encerramento manual interrompa imediatamente uma
execução adquirida pelo worker.

## Comportamento

Ao receber `SIGTERM` ou `SIGINT`, o worker:

1. interrompe novas aquisições pelo `WorkerLoop.parar()`;
2. mantém a execução atual e eventual sessão interativa disponíveis;
3. aguarda o `WorkerLoop` concluir até o prazo configurado;
4. para o heartbeat periódico;
5. fecha o servidor HTTP e conexões ociosas;
6. fecha o runtime do navegador;
7. encerra com código `0` quando loop e servidor terminaram no prazo.

Quando o prazo expira:

- conexões HTTP remanescentes são encerradas;
- o browser é fechado de forma controlada;
- o processo termina com código diferente de zero;
- o lease existente permanece responsável pela recuperação posterior no backend.

Um segundo sinal durante o drain força o encerramento.

## Configuração

```text
WORKER_SHUTDOWN_GRACE_PERIOD_MS=120000
WORKER_SHUTDOWN_SERVER_CLOSE_TIMEOUT_MS=10000
WORKER_SHUTDOWN_STOP_GRACE_PERIOD=130s
```

- o prazo interno aceita entre 5 segundos e 30 minutos;
- o fechamento HTTP aceita entre 1 e 60 segundos;
- `stop_grace_period` do Compose deve ser maior que a soma operacional esperada, para o Docker não
  enviar `SIGKILL` antes do worker terminar.

Os overrides `dev` e `onpremise` aplicam as variáveis e o `stop_grace_period`.

## Sessão interativa

Uma sessão já aberta continua disponível enquanto a execução está dentro do período gracioso. O
servidor não é fechado antes do término do loop. Se o prazo expirar, conexões, contexto Playwright e
sessão são encerrados; o ticket consumido não volta a ser válido.

## Segurança e consistência

- nenhuma nova execução é adquirida após o pedido de parada;
- o worker não marca resultado artificial para “concluir” o shutdown;
- o lease continua sendo renovado enquanto a execução realmente está ativa;
- não há chamada fiscal nova;
- não há persistência de segredo ou payload;
- nenhum estado fiscal é alterado pelo coordenador de shutdown.

## Validação realizada

- revisão estática da ordem `parar loop → aguardar → fechar HTTP → fechar browser`;
- revisão do segundo sinal e dos timeouts com teto;
- revisão dos overrides Compose e do `stop_grace_period`;
- verificação de que o server permanece disponível durante o drain normal;
- nenhuma migration e nenhuma dependência nova.

## Validação runtime pendente

- worker ocioso recebe `SIGTERM` e encerra com código `0`;
- execução API curta termina antes do processo;
- execução portal e sessão interativa podem concluir durante o drain;
- timeout fecha o processo com código diferente de zero e o backend recupera o lease;
- segundo sinal força encerramento;
- `docker compose stop automation-worker` respeita o grace period;
- reinício não produz execução duplicada.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
