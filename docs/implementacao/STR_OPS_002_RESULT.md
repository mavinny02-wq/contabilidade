# STR-OPS-002 — resultado

**ITEM:** `STR-OPS-002`

**WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_011`

**BASELINE:** `eca3cd61f9ea11770ca5c31bf985906dec0954bb` (`latest main` recebido)

**STATUS:** `PASS_ESTRUTURAL`

## Owners alterados

- `scripts/recovery/**`: schema, policy, planner offline, guard, fixtures e testes sintéticos;
- `.github/workflows/recovery-rehearsal.yml`: workflow dedicado e sem acesso a dados reais;
- este `RESULT_MD`.

Os scripts de backup e verificação existentes permaneceram somente leitura. Nenhuma migration,
volume, banco, documento, backup real, Compose ou provider externo foi tocado.

## Entrega

O planner valida completude, unicidade, tamanho declarado, formato de SHA-256, checksum canônico do
manifesto, frontier, antiguidade/RPO e alvo efêmero, vazio e não produtivo antes de emitir um plano.
O plano tem ordem fixa e determinística, declara modo exclusivamente offline e deixa RTO como
contrato de medição. O guard recusa tokens de comandos destrutivos/restauração no executável.

As fixtures sintéticas cobrem conjunto válido, dump ausente, archive ausente, checksum divergente,
componente duplicado, frontier incompatível, backup antigo, target inseguro e ordem inválida.
Findings retornam somente campo/categoria e não ecoam paths, clientes, conteúdo, segredos ou chaves.

## Locks preservados

- `LOCK-DATA-001`: somente fixtures sintéticas; nenhuma credencial ou dado real;
- `LOCK-ENV-001`: nenhuma alegação de prova Windows, Docker Desktop ou runtime real;
- `LOCK-EVID-001`: evidência focada no novo owner e comparação byte a byte reutilizável;
- `LOCK-TEST-001`: validação contratual autorizada; nenhuma falha de produção foi inferida ou
  corrigida.

## Validação estrutural

- `python3 -m json.tool scripts/recovery/schemas/recovery-manifest.schema.json` — `PASS`;
- `python3 -m json.tool scripts/recovery/recovery-policy.v1.json` — `PASS`;
- `python3 -m unittest scripts.recovery.tests.test_recovery_planner` — `PASS` (8 testes);
- `python3 scripts/recovery/forbidden_command_guard.py` — `PASS`;
- duas execuções de `recovery_planner.py` seguidas de `cmp` — `PASS`, planos byte-idênticos;
- `git diff --check` — `PASS`.

## Limitações e provas pendentes

Esta task não executa restore, não mede RTO real e não constitui prova de banco, storage, Docker,
Windows ou recuperação real. A execução real continua fora deste owner, em `STR-OPS-001`.

## Commit e PR

- commit: `feat(recovery): add offline rehearsal planner`;
- PR: `NOT_CREATED_ENVIRONMENT_LIMITATION` — checkout sem remote e GitHub CLI sem autenticação.
