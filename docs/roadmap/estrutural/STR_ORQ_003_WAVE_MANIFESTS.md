# STR-ORQ-003 — manifests de ondas

**Objetivo:** materializar estados prepared/released/consumed com schema e validação determinística.

## Escopo

- schemas JSON/Markdown;
- diretórios prepared/released/consumed/superseded;
- baseline/owners/locks/migration/result paths;
- refresh antes de release;
- pack <=5 e migration owner <=1;
- consumo/supersession explícitos.

## Aceite

Prepared não contém launcher; released passa guard; consumed não pode ser relançado.
