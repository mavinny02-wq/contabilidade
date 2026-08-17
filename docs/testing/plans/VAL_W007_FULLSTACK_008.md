# VAL-W007-FULLSTACK-008 — smoke consolidado após a Fast Lane 007

## Dispatch

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_FAST_LANE_WAVE_008 --item VAL-W007-FULLSTACK-008 --baseline 77141fae2f04a430bc2cb51264886c083977a3ce \
  --key 226c9ff3c05b6024571a8b34eaaa9355c001b0d97870977502178db5aec5cd95 --github-aware --register
```

## Owner

Produto, migrations, dependências, manifests e configurações executáveis são read-only. O owner
escreve somente `docs/testing/runs/VAL_W007_FULLSTACK_008.md`.

## Objetivo

Comprovar o HEAD atual depois das cinco integrações da Wave 007 e da correção Buildx da PR `#101`,
sem repetir campanhas não invalidadas e sem corrigir produção dentro da validação.

## Prova obrigatória

- Node 24, Java 21, Maven, PostgreSQL isolado e Chromium compatível;
- guard e testes Node da orquestração Docker/Buildx;
- build de backend, frontend e worker;
- Flyway V1–V12, JPA validate, liveness/readiness, frontend e worker saudáveis;
- heartbeat persistido e proxy frontend → backend;
- no mínimo 19 jornadas full-stack e smoke a11y das rotas representativas;
- zero chamada externa/provider real, zero dado real e zero HTTP 5xx;
- encerramento sem handles, browsers ou processos órfãos;
- nenhuma alegação de PowerShell, Docker Desktop ou runtime Windows sem evidência desse ambiente.

## Disposição

`PASS` fecha a invalidação focada. Qualquer falha recebe classificação exata e successor separado.
`ENVIRONMENT_LIMITATION` não autoriza alterar produto, threshold, fixture ou contrato.

## Validação

Usar os launchers canônicos já existentes para full-stack e a11y, executar
`validate-docker-orchestration.mjs` e seu teste Node, e bloquear rede externa após o provisionamento.
Registrar comandos, versões, contagens, limitações e evidência no resultado.
