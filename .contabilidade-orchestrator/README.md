# Orquestrador Contabilidade v2

Contrato humano/máquina alinhado à orquestração madura:

- GitHub-first;
- contexto roteado HOT/WARM/COLD;
- checkpoint canônico;
- de um a cinco owners executáveis, sem filler;
- mesmo baseline e sem dependência same-wave;
- no máximo um migration owner;
- lifecycle prepared/released/consumed;
- documentação-only owned pelo orquestrador;
- evidência classificada e reutilizável;
- Cloud separado de Windows;
- sem provider real/pago por padrão;
- guards determinísticos em CI.

Arquivos canônicos:

```text
docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md
docs/orquestracao/CONTABILIDADE_WAVE_ORCHESTRATION_V2.md
docs/testing/MASTER_TEST_ORCHESTRATION.md
docs/roadmap/BACKLOG_ESTRUTURAL.md
```

`.contabilidade-orchestrator/output/plano-onda.json` é apenas router machine-readable. Prompts
`PREVIEW_*` antigos são históricos e nunca executáveis.
