# Roadmap de maturidade da engenharia e orquestração

## M0 — Fundação governada

Saída:

- `AGENTS.md` hierárquicos;
- checkpoint único;
- locks;
- ledger de testes;
- contexto HOT/WARM/COLD;
- launchers compactos;
- guards em CI;
- backlog estrutural.

Critério: guard verde e documentação integrada.

## M1 — Determinismo de Git, owners e migrations

Saída:

- branch protection/required checks;
- CODEOWNERS/hotspots;
- registry Flyway monotônico;
- manifests de onda;
- versão/release consistente.

Critério: nenhuma onda liberada com overlap, filler ou migration concorrente.

## M2 — Evidência reutilizável e runtime reproduzível

Saída:

- `GATE-VAL-001` decomposto;
- matriz de reuse/invalidation;
- coletor Windows machine-readable;
- campanhas pinadas a SHA;
- coverage declarado somente quando medido.

Critério: reruns focados e nenhuma promoção indevida entre Cloud/Windows.

## M3 — Segurança, contratos e observabilidade

Saída:

- guards de segredo/PII;
- SBOM/licenças/vulnerabilidades;
- OpenAPI compatibility;
- PostgreSQL/Testcontainers;
- worker reliability;
- frontend accessibility/browser;
- SLO/correlação/runbooks.

Critério: riscos críticos possuem owner, guard e evidência.

## M4 — Otimização contínua

Saída:

- telemetry real de tokens/custo por outcome;
- budgets de performance;
- ratchets de qualidade;
- ADR/boundary enforcement;
- rehearsal de restore/rollback;
- revisão periódica deep.

Critério: mediana/p95 e tendência de qualidade/custo visíveis, sem perder autoridade.

## Indicadores

- % tasks com `RESULT_MD`;
- % waves sem overlap;
- migrations concorrentes: zero;
- reruns evitados por `REUSE_PASS`;
- tempo de reconciliação fast;
- falhas por classificação;
- coverage realmente medido;
- findings de segredo/PII/licença;
- tokens e custo por resultado, quando telemetry real existir.
