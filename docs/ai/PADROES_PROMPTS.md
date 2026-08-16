# Padrões de prompts

**Autoridade:** `docs/ai/TEMPLATE_LAUNCHER_COMPACTO.md`

Templates antigos em `.contabilidade-orchestrator/templates/` são legados, salvo o launcher compacto
v2.

## Regras

- launcher não é segunda especificação;
- até 12 linhas como alvo, 20/2.000 como hard limit;
- um ITEM/owner/result;
- referências canônicas, não requisitos copiados;
- baseline e migration explícitos;
- sem PR/SHA/data histórica reutilizável;
- sem gate condicional;
- policy comum é dita uma vez fora do pack;
- pack possui de um a cinco launchers e no máximo um migration owner.

## Tipos

- implementação/correção: owner de produção bounded + validação estrutural;
- teste: owner de prova explícito, produção proibida;
- documentação/reconciliação/intake/decisão: orquestrador, sem launcher por padrão;
- prova Windows: artefato preparado no Cloud, execução humana e reconciliação posterior.
