# Roadmap do produto — roteador atual

## Autoridades

- checkpoint: `docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md`;
- gate P0: `docs/orquestracao/STARTUP_RELIABILITY_GATE.md`;
- ledger: `docs/testing/MASTER_TEST_ORCHESTRATION.md`;
- backlog: `docs/roadmap/BACKLOG_ESTRUTURAL.md`.

## Hold atual

A Fast Lane Wave 012 foi superseded. A
`CONTABILIDADE_STARTUP_RECOVERY_WAVE_013` foi liberada com um único owner serial para a correção e
seu harness inseparável.

Nenhuma nova funcionalidade, guard de maturidade ou wave comum é selecionada até:

```text
VAL-WINDOWS-COMPOSE-STARTUP-001 = PASS
```

## Sequência obrigatória

1. corrigir lifecycle do startup probe com executor nativo central;
2. integrar Pester, Docker lifecycle e Compose E2E;
3. executar primeiro `START_CONTABILIDADE.bat dev`;
4. repetir o startup e comprovar reuso do PostgreSQL;
5. coletar evidência Windows v2;
6. somente então liberar on-premise/Keycloak;
7. depois recalcular a próxima wave estrutural ou funcional.

## Itens retornados ao backlog

- TLS/certificados;
- IaC on-premise;
- paridade local do Required CI;
- synthetic monitoring.

Eles permanecem válidos, mas não têm launcher autorizado durante o P0.

## Regras

- até cinco owners reais, nunca filler;
- no máximo um migration owner;
- documentação direta não consome Codex;
- Cloud/Linux não substitui Windows/Docker Desktop;
- nenhuma declaração de startup verde sem primeira e segunda execução;
- providers, chamadas pagas, credenciais e dados reais permanecem negados.

`ROADMAP_PRODUTO_STARTUP_RECOVERY_WAVE_013_RELEASED`
