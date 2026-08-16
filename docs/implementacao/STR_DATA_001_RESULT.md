# STR-DATA-001 — Resultado

- **ITEM:** `STR-DATA-001`
- **WAVE_ID:** `CONTABILIDADE_QUALITY_GATE_WAVE_005`
- **DISPATCH_KEY:** `835bed59be0169475abb1edc00b554f04d773f255d478b691d7bd1903f25a6af`
- **CONTRACT:** `2.0`
- **Baseline do checkout:** `f9559a5` (`latest main` disponibilizada no ambiente)
- **Baseline registrado pelo dispatch:** `c3c06e8cb5921f96ecdb9b1e397594d01dd4430f`
- **Status:** `PASS`

## Owners alterados

- `scripts/testing/**`: política executável, catálogo, gerador, fixture e testes focados.
- `docs/implementacao/STR_DATA_001_RESULT.md`: este handoff.

Nenhum código funcional, migration, manifest, lockfile, teste existente ou scanner de segurança foi
alterado.

## Entrega

O catálogo governa **1 fixture**, **1 schema** e **1 checksum SHA-256**. O valor do checksum está no
catálogo machine-readable; este resultado não replica conteúdo de fixture nem valores que possam
ser sensíveis. A fixture declara ficção, owner, propósito, schema/versionamento, seed, instante fixo,
gerador, classificação e checksum do conteúdo normalizado.

O guard limita o inventário ao diretório próprio, rejeita divergência catálogo/disco, metadados ou
seed ausentes, checksum divergente, geração não determinística, domínio não reservado, identificador
fiscal sem marcação sintética e achados do guard existente. Achados são reportados somente por regra
e fingerprint, sem expor o valor detectado. Não há chamada externa.

## Locks preservados

- `LOCK-DATA-001`: somente dados explicitamente sintéticos; suspeitas são redigidas.
- `LOCK-EXT-001`: geração e validação são integralmente locais.
- `LOCK-TEST-001`: os testes focados validam o novo contrato sem alterar produção ou testes existentes.

## Validação

| Comando | Resultado |
|---|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_QUALITY_GATE_WAVE_005 --item STR-DATA-001 --baseline c3c06e8cb5921f96ecdb9b1e397594d01dd4430f --key 835bed59be0169475abb1edc00b554f04d773f255d478b691d7bd1903f25a6af --github-aware --register` | `PASS`; dispatch permitido. Auditoria remota indisponível por ausência de `GITHUB_REPOSITORY`/`GITHUB_TOKEN`. |
| `python3 scripts/testing/synthetic_fixture_guard.py` | `PASS`; 1 fixture e 1 schema. |
| `python3 -m unittest discover -s scripts/testing -p 'test_*.py' -v` | `PASS`; 8 testes. |
| `git diff --check` | `PASS`. |

## Limitações e provas pendentes

A validação foi estrutural e focada, conforme o launcher. Não constitui prova de runtime Windows,
banco, browser, provider externo ou integração. Nenhuma dessas provas é necessária para este owner.

## Commit e PR

- **Commit:** preenchido no histórico Git desta entrega.
- **PR:** não criado: a ferramenta `make_pr` não está disponível neste ambiente e não há remote Git configurado.
