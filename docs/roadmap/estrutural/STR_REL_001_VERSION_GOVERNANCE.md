# STR-REL-001 — governança de versão e release

**Objetivo:** evitar drift entre `VERSION`, Maven, npm, manifests, imagens, changelog e docs.

## Escopo

- inventário de fontes;
- definição da fonte canônica;
- guard determinístico;
- regra de bump/release;
- compatibilidade com on-premise/artifact-only.

## Aceite

Drift falha CI; release associa SHA, versão, imagens/digests e rollback.
