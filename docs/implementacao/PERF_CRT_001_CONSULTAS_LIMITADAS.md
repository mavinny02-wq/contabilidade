# PERF-CRT-001 — Consultas limitadas no scheduler de certidões

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`

Implementação autorizada pelo usuário antes do fechamento de `GATE-VAL-001`. O item não fecha o
gate e não libera automaticamente os demais candidatos.

## Problema

Os dois jobs do Centro de Certidões carregavam todas as empresas e todas as certidões ativas em uma
única execução. O custo de memória, tempo de transação e quantidade de queries cresciam linearmente
com a base inteira. Uma configuração de provider inválida nas primeiras linhas vencidas também podia
impedir progresso previsível sobre os registros posteriores.

## Solução

O scheduler passou a usar lotes limitados e cursores rotativos em memória:

- inicialização de acompanhamentos ausentes: 100 empresas por lote por padrão;
- agendamento de certidões vencidas: 200 acompanhamentos por lote por padrão;
- análise de alertas: 300 acompanhamentos por lote por padrão;
- todos os limites são configuráveis e protegidos entre 1 e 5.000;
- os repositories retornam somente IDs ordenados, sem materializar a base inteira;
- cada empresa, agendamento e alerta é processado por uma transação própria;
- erros esperados de política/provider são contabilizados e não interrompem o restante do lote;
- o cursor avança somente depois que o lote termina sem erro inesperado;
- ao alcançar o fim dos IDs, o cursor volta ao início na próxima consulta;
- o idempotency key diário do scheduler foi preservado.

## Configuração

```text
APP_CERTIFICATE_INITIALIZATION_BATCH_SIZE=100
APP_CERTIFICATE_SCHEDULER_BATCH_SIZE=200
APP_CERTIFICATE_ALERT_BATCH_SIZE=300
```

## Arquivos principais

- `backend/src/main/java/br/com/contabilidade/certidao/service/CertidaoScheduler.java`;
- `backend/src/main/java/br/com/contabilidade/certidao/service/CertidaoSchedulerBatchService.java`;
- `backend/src/main/java/br/com/contabilidade/certidao/service/CertidaoAlertaService.java`;
- `backend/src/main/java/br/com/contabilidade/certidao/repository/CertidaoAcompanhamentoRepository.java`;
- `backend/src/main/java/br/com/contabilidade/empresa/repository/EmpresaRepository.java`;
- `backend/src/main/resources/application.yml`.

## Comportamento preservado

- criação idempotente dos acompanhamentos aplicáveis por empresa/estabelecimento;
- política, fallback, custo e idempotência da solicitação;
- estados fiscal e técnico;
- emissão única dos alertas de vencimento e irregularidade;
- nenhuma migration ou mudança de dados;
- nenhum provider externo acionado durante a implementação.

## Validação necessária

- compilação Maven com Java 21;
- execução manual com uma base contendo mais registros que o tamanho do lote;
- comprovar avanço e wrap dos três cursores;
- comprovar que uma política ausente não bloqueia IDs posteriores;
- observar tempo e memória dos jobs;
- confirmar ausência de duplicação de execuções e notificações.

## Limitação consciente

Os cursores são locais ao processo, assim como o scheduler atual. Em uma futura implantação com
múltiplas réplicas do backend, o scheduler deverá receber coordenação distribuída ou ownership por
partição. Esta task não introduz migration nem mecanismo de eleição.
