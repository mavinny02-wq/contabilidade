# STR-REL-003 — resultado

- **ITEM:** `STR-REL-003`
- **Baseline:** `eca3cd6` (latest `main` supplied in the execution checkout)
- **Status:** `PASS_STRUCTURAL`
- **Owner alterado:** `scripts/release/promotion/**`, workflow dedicado e este resultado
- **Migration:** `NONE`

## Entrega

Foi criado um contrato offline de promoção imutável com schema e policy versionada, autoridade de
`VERSION`/Git/Flyway, inventário confiável de digests, validação de componentes obrigatórios,
evidências, transições excepcionais com expiração e compatibilidade de rollback. O relatório JSON ou
Markdown é determinístico e omite repositórios e qualquer dado de registry. O workflow apenas lê o
checkout e executa fixtures; não autentica, publica, puxa imagens, reconstrói ou faz deploy.

## Locks preservados

- `LOCK-DEP-001`: tooling offline preserva operação on-premise first e não pressupõe cloud/registry.
- `LOCK-GIT-001`: SHA do Git é autoridade explícita; entrega segue branch/commit/PR.
- `LOCK-EVID-001`: IDs de evidência são obrigatórios e a saída determinística permite reuso.
- `LOCK-TEST-001`: validação bounded não alterou produção; nenhuma falha de baseline foi observada.

## Validação estrutural

- `python -m unittest discover -s scripts/release/promotion/tests -p 'test_*.py' -v` — PASS, 7 testes.
- `python -m json.tool` sobre schema, policy e todas as fixtures — PASS.
- `git diff --check` — PASS.

Fixtures cobrem promoção e rollback seguros, tag mutável, digest inválido, divergência de versão/SHA,
downgrade de schema, rollback inseguro e exceção expirada. Os testes adicionais cobrem componente
duplicado, artefato ausente, divergência contra inventário de build, determinismo e exit codes.

## Limitações e provas pendentes

Validação estrutural não prova registry, promoção, rollback, banco, runtime ou ambiente Windows. A
igualdade com digest observado em registry e as operações reais continuam na campanha `STR-REL-002`.
O guard não recebe credenciais e não realiza chamadas externas.

## Commit/PR

Commit criado nesta branch; PR criado pelo fluxo de entrega após o commit.
