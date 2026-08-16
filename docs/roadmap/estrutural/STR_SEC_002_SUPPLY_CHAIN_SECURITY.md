# STR-SEC-002 — segurança de supply chain

**Objetivo:** criar uma lane independente de SAST, configuração, containers e provenance sem
alterar dependências do produto nem depender de provider fiscal.

## Dispatch obrigatório

Antes de editar:

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_HARDENING_WAVE_006 \
  --item STR-SEC-002 \
  --baseline a3344a15a0581fd7f76f78766c6432b46f9a361e \
  --key 3088e636102f43188815c68c1cb2f9ab059befe9cfd09dc84da5b49b6d901547 \
  --github-aware --register
```

Resultado e descrição da PR devem conter:

```text
DISPATCH_KEY: 3088e636102f43188815c68c1cb2f9ab059befe9cfd09dc84da5b49b6d901547
```

Duplicata bloqueada encerra a task como `SUPERSEDED_DUPLICATE_OWNER` sem editar.

## Owner

Pode alterar somente:

- novo `.github/workflows/supply-chain-security.yml`;
- `scripts/security/supply-chain/**`;
- políticas, fixtures e exceções desse owner;
- `docs/implementacao/STR_SEC_002_RESULT.md`.

Dockerfiles, Compose, código, manifests, lockfiles, SBOMs e workflows existentes são read-only.

## Escopo

Implementar controles reproduzíveis para:

- SAST Java/TypeScript com regras focadas em auth, injeção, path traversal, SSRF, secrets e logs;
- scan de filesystem/IaC/Dockerfile;
- scan das três imagens quando o runner permitir build local;
- validação de ações GitHub novas por SHA completo;
- inventário de imagem-base/tag/digest e material de provenance;
- política de severidade e exceções com owner, motivo e expiração.

Ferramentas e regras devem ter versão fixa. Scan dependente de feed/rede falha ou é
`ENVIRONMENT_LIMITATION`; nunca vira PASS por indisponibilidade.

## Segurança

- relatório não reproduz segredo, PII ou payload fiscal;
- nenhuma imagem é publicada;
- nenhuma credencial de registry é necessária;
- nenhuma exceção permanente sem expiração;
- nenhuma mudança de produção para satisfazer scanner.

## Testes

Cobrir fixtures positivas/negativas, exceção válida/vencida, severidade, redaction, imagem ausente e
feed indisponível. Validar YAML, policy e `git diff --check`.

## Aceite

- workflow dedicado e política determinística;
- SAST/IaC/container configurados;
- achado HIGH/CRITICAL sem exceção válida falha;
- provenance local associa artefato/imagem ao SHA sem afirmar publicação;
- resultado classifica claramente o que foi realmente executado.
