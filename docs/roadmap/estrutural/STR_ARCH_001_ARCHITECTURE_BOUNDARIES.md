# STR-ARCH-001 — boundaries e ciclos arquiteturais

**Objetivo:** tornar explícitas e verificáveis as dependências internas do backend, frontend e
worker, bloqueando novos ciclos e violações sem reescrever o código existente.

## Dispatch obrigatório

Antes de editar:

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_HARDENING_WAVE_006 \
  --item STR-ARCH-001 \
  --baseline a3344a15a0581fd7f76f78766c6432b46f9a361e \
  --key 2a7a896f3fa04ee0feb9d60a91967b578bba52c516450af017cbd0bcc6e1a185 \
  --github-aware --register
```

Resultado e descrição da PR devem conter:

```text
DISPATCH_KEY: 2a7a896f3fa04ee0feb9d60a91967b578bba52c516450af017cbd0bcc6e1a185
```

Duplicata bloqueada encerra a task como `SUPERSEDED_DUPLICATE_OWNER` sem editar.

## Owner

Pode alterar somente:

- `scripts/architecture/**`;
- novo `.github/workflows/architecture-boundaries.yml`;
- baseline/allowlist versionada desse guard;
- `docs/implementacao/STR_ARCH_001_RESULT.md`.

Todo código de produto, manifests, lockfiles, migrations e workflows existentes são read-only.

## Análise e política

Gerar grafo determinístico de imports/dependências para:

- pacotes Java por módulo funcional e `common`;
- frontend `app`, `pages`, `features`, `api`, `auth`, `components`;
- worker core, browser/session, backend client e fluxos de provider.

Detectar:

- ciclos novos;
- feature Java dependendo diretamente de repository/controller de outra feature;
- `common` dependendo de feature;
- frontend `api` dependendo de pages/app;
- imports entre páginas para compartilhar regra;
- core do worker dependendo de implementação concreta de provider;
- dependência por path relativo que cruza boundary proibido.

A primeira execução inventaria o estado atual. Violações existentes, quando reais, entram em
allowlist com fingerprint, motivo, owner e expiração/revisão; novas violações falham.

## Testes

Cobrir grafo estável, ciclo sintético, edge proibida, allowlist válida/vencida, path alias e
resultado determinístico. Executar guard no baseline, testes, YAML parse e `git diff --check`.

## Aceite

- grafo e baseline reproduzíveis;
- zero novo ciclo permitido;
- política não depende de serviço externo;
- findings apontam origem/destino/regra sem copiar código sensível;
- nenhuma alteração de produto nesta task.
