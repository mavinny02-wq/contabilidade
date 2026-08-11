# AUT-LIM-001 — Limites de recursos da sessão interativa

## Objetivo

Impedir crescimento não controlado de contextos Playwright e conexões SSE quando múltiplas
intervenções ou clientes tentam usar a sessão interativa simultaneamente.

## Escopo implementado

- limite configurável de sessões interativas ativas por worker;
- reserva de capacidade durante criações concorrentes;
- limite configurável de assinantes SSE por sessão;
- rejeição com HTTP `429` e código estável quando o limite é atingido;
- limpeza da reserva quando a inicialização falha;
- encerramento da sessão parcialmente criada em caso de erro no CDP/screencast;
- capacidade atual publicada no health do worker;
- valores propagados pelo Compose e documentados no `.env.example`.

## Configuração

```text
WORKER_MAX_INTERACTIVE_SESSIONS=2
WORKER_MAX_SSE_SUBSCRIBERS_PER_SESSION=3
```

Limites aceitos:

- sessões por worker: 1 a 20;
- assinantes por sessão: 1 a 20.

Valores inválidos são normalizados aos padrões seguros.

## Concorrência

A contagem considera tanto sessões já registradas quanto criações em andamento. Assim, duas
criações assíncronas não conseguem ultrapassar o limite antes de `newCDPSession` terminar.

Quando o limite de SSE é atingido, a nova conexão é recusada antes do envio dos cabeçalhos de
stream. Assinantes que fecham a conexão liberam sua vaga normalmente.

## Observabilidade

`GET /health` e `GET /automation/health` passam a retornar:

```text
capacidadeSessoesInterativas.maxSessions
capacidadeSessoesInterativas.maxSubscribersPerSession
capacidadeSessoesInterativas.activeSessions
capacidadeSessoesInterativas.pendingCreations
capacidadeSessoesInterativas.totalSubscribers
```

Nenhum identificador de sessão, usuário, ticket ou grant é exposto nessa capacidade agregada.

## Segurança

- não altera HMAC, anti-replay ou cookie HttpOnly;
- não persiste sessão, frame ou entrada do operador;
- não registra ticket, grant ou conteúdo do screencast;
- não chama provider externo;
- nenhuma migration ou dependência nova.

## Validação pendente

- typecheck e build do worker;
- uma criação abaixo do limite;
- criação concorrente acima do limite retornando `429`;
- conexão SSE até o limite e assinante excedente retornando `429`;
- liberação de vagas após `dispose` e fechamento SSE;
- falha durante `Page.startScreencast` sem vazamento de vaga;
- health refletindo contagens e limites reais;
- Compose `dev` e `onpremise` propagando os valores.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
