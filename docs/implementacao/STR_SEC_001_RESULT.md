# STR-SEC-001 — resultado

- **ITEM:** STR-SEC-001
- **Baseline:** `6f9f7a6` (latest main disponibilizada no checkout)
- **Status:** concluído
- **Owners alterados:** scanner/política/testes locais em `scripts/security/**`; workflow dedicado
  `.github/workflows/secret-pii-guard.yml`; este resultado.
- **Locks preservados:** `LOCK-DATA-001` (somente dados sintéticos e saída redigida),
  `LOCK-EXT-001` (nenhuma chamada externa/provider) e `LOCK-TEST-001` (achados do baseline foram
  classificados como placeholders ou fixtures sintéticas, com exceções limitadas por caminho,
  regra, fingerprint, owner, motivo e expiração).
- **Migration:** nenhuma.

## Entrega

O guard determinístico usa apenas Python standard library e `git ls-files`, ignora conteúdo binário
e informa somente caminho, linha, regra e fingerprint SHA-256 truncada. A política versionada contém
exclusões explícitas e exceções escopadas, sem armazenar o valor detectado. O workflow não publica
artefatos nem conteúdo de findings.

## Validação

- `python3 scripts/security/secret_pii_guard.py --json` — passou no baseline rastreado, sem findings
  ou exceções expiradas.
- `python3 scripts/security/test_secret_pii_guard.py` — 3 testes sintéticos passaram, cobrindo
  positivos (chave privada, JWT, bearer e CPF), negativos/placeholders, redaction e exceção expirada.
- `python3 -m py_compile scripts/security/secret_pii_guard.py scripts/security/test_secret_pii_guard.py`
  — passou.
- `git diff --check` — passou.

## Limitações e provas pendentes

Esta validação prova comportamento local sintético e inspeção dos arquivos rastreados; não constitui
prova de runtime Windows, provider fiscal, banco ou dados reais. A execução do workflow no GitHub
permanece como prova de CI após a publicação do PR.

## Commit/PR

- **Commit:** commit `feat: add local secret and PII guard` que contém este resultado.
- **PR:** `NOT_CREATED_ENVIRONMENT_LIMITATION` — o checkout não possui remote Git configurado e a
  ferramenta `make_pr` não está disponível nesta sessão.
