# STR-ORQ-001 — proteção da main

**Objetivo:** configurar proteção da `main` com PR obrigatório e checks de build/governança.

## Escopo

- inspecionar settings atuais;
- definir required checks existentes e o novo `orchestration-governance`;
- impedir push direto/force push/deletion;
- preservar merge pelo usuário;
- documentar exceção de recuperação.

## Limite

Parte da mudança ocorre em GitHub settings e exige evidência. Não inventar team/reviewer.
Não alterar código de produto.

## Aceite

- proteção observável;
- PR requerida;
- checks required;
- force push/deletion bloqueados;
- resultado/evidência persistidos.
