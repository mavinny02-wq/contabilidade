# STR-FE-BUNDLE-001 — reduzir o chunk inicial do frontend

**Objetivo:** reduzir o maior chunk bruto do baseline de aproximadamente 530,5 KiB para abaixo de
500 KiB, preferencialmente por divisão de rotas, sem nova dependência e sem alterar comportamento.

## Dispatch obrigatório

Antes de editar:

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_HARDENING_WAVE_006 \
  --item STR-FE-BUNDLE-001 \
  --baseline a3344a15a0581fd7f76f78766c6432b46f9a361e \
  --key 5bb7c05a84f55b04849a905fcdae4447b71f77ce9527c18b039cef2b15b8a04e \
  --github-aware --register
```

Resultado e descrição da PR devem conter:

```text
DISPATCH_KEY: 5bb7c05a84f55b04849a905fcdae4447b71f77ce9527c18b039cef2b15b8a04e
```

Duplicata bloqueada encerra a task como `SUPERSEDED_DUPLICATE_OWNER` sem editar.

## Owner

Pode alterar somente:

- `frontend/src/app/router.tsx`;
- boundaries/imports de páginas necessários para lazy loading;
- fallback/error boundary de carregamento e testes focados;
- `frontend/vite.config.ts`, apenas quando necessário para chunking determinístico;
- `docs/implementacao/STR_FE_BUNDLE_001_RESULT.md`.

`package.json`, lockfile, APIs, regras de permissão, i18n comum e demais owners são read-only.

## Requisitos

- carregar páginas por rota com `lazy`/`Suspense` ou API lazy do router;
- preservar `ProtectedRoute`, `PermissionRoute`, redirects e páginas de erro;
- fallback acessível e internacionalizado com recurso já existente;
- falha de chunk deve produzir experiência controlada, não tela vazia;
- não esconder o warning elevando artificialmente o limite;
- não duplicar React, i18n ou router em vários chunks;
- nenhuma mudança de endpoint ou regra de negócio.

## Validação

Executar Node 24:

- locale, typecheck, testes e build;
- testes de rota/permissão/lazy fallback;
- medição pelo guard de performance;
- comparação do maior chunk bruto/gzip e tamanho total;
- inspeção de imports estáticos residuais;
- `git diff --check`.

## Aceite

- maior chunk bruto < 500 KiB, ou redução comprovada com blocker técnico explícito;
- navegação e permissões preservadas;
- nenhum novo pacote;
- budget permanece mais estrito que o baseline anterior;
- RESULT_MD registra antes/depois e nomes dos chunks sem afirmar melhoria não medida.
