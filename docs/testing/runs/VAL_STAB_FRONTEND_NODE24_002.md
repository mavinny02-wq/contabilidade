# VAL-STAB-FRONTEND-NODE24-002 — estabilidade do frontend com Node.js 24

## Identificação

| Campo | Valor |
|---|---|
| Task | `VAL-STAB-FRONTEND-NODE24-002` |
| Data da execução | `2026-08-16` (UTC) |
| Branch preparada | `node-24-frontend` |
| Baseline disponível | `4c07f16a8a66abb76983c9203c8e694c748f0af0` |
| Descrição do baseline | `Merge pull request #64 from mavinny02-wq/codex/validate-fullstack-with-end-to-end-tests` |
| Escopo | `frontend/**` somente leitura; este relatório é a única alteração persistente |
| Locks respeitados | `LOCK-EXT-001`, `LOCK-DATA-001`, `LOCK-TEST-001`, `LOCK-EVID-001` |
| Migration | nenhuma |
| Classificação | **APROVADO COM RESSALVA DE BASELINE/ENTRADAS** |

## Entradas lidas e disponibilidade

- `AGENTS.md`: lido e aplicado.
- `frontend/AGENTS.md`: não existe no baseline disponível.
- `docs/testing/plans/VAL_STAB_FRONTEND_NODE24_002.md`: não existe no baseline disponível.
- `frontend/package.json` e `frontend/package-lock.json`: consultados para conferir scripts,
  engines e reprodutibilidade da instalação.

O repositório fornecido não possui remote Git nem referência local `main`; havia somente a branch
`work` no commit acima. Assim, não foi possível buscar ou comprovar `latest main`. A branch
`node-24-frontend` foi preparada diretamente a partir do HEAD disponibilizado.

## Ambiente

- Sistema: `Linux 6.18.35 x86_64`.
- Node.js: `v24.19.0`, instalado e executado pelo `mise`.
- npm: `11.17.0`.
- Engine declarado pelo frontend: Node.js `>=22.12.0` e npm `>=10`.
- SHA-256 de `frontend/package-lock.json`:
  `dde31434421200291966471c9277f13bd0f66842a861ad0e63701d26f12fa709`.

Uma primeira tentativa com `mise x node@24 -- npm ci` foi rejeitada porque o `npm` resolveu o
Node.js 20 já presente no início do `PATH` e emitiu `EBADENGINE`. Nenhuma validação subsequente
foi aceita dessa tentativa. O binário do Node.js 24 foi então ativado explicitamente no início do
`PATH`; a instalação foi repetida, não emitiu `EBADENGINE` e todos os gates foram executados nesse
runtime.

## Validações executadas com Node.js 24

| Ordem | Comando | Código | Resultado |
|---:|---|---:|---|
| 1 | `cd frontend && npm ci` | `0` | 183 pacotes instalados a partir do lockfile; nenhum `EBADENGINE` |
| 2 | `cd frontend && npm run locale:validate` | `0` | bundle `pt-BR` válido; 22 catálogos, 64 arquivos e 86 entradas dinâmicas verificados |
| 3 | `cd frontend && npm run typecheck` | `0` | TypeScript sem erro |
| 4 | `cd frontend && npm test` | `0` | 7 arquivos e 20 testes aprovados |
| 5 | `cd frontend && npm run build` | `0` | build Vite concluído; 152 módulos transformados |

O `npm ci` também informou um pacote com script ainda não coberto por `allowScripts`
(`esbuild@0.28.2`) e a configuração obsoleta `http-proxy`; ambos foram avisos, sem falha. O build
produziu `dist/index.html`, CSS e JavaScript e alertou que o chunk JavaScript minificado tem
`543,27 kB`, acima do limiar padrão de `500 kB`.

## Resultado e comportamento preservado

- A instalação bloqueada, a integridade do catálogo `pt-BR`, a tipagem, a suíte automatizada e o
  build de produção passaram com Node.js 24, sem `EBADENGINE` na execução aceita.
- Nenhum código, teste, dependência, lockfile, configuração, dado ou migration foi alterado.
- Nenhuma integração externa, operação fiscal, acesso a documento ou mutação de banco foi
  executada.
- O arquivo incremental rastreado `frontend/tsconfig.app.tsbuildinfo`, atualizado pelos comandos
  TypeScript, foi restaurado ao conteúdo do baseline para manter `frontend/**` somente leitura.

## Pendências e ressalvas

1. Disponibilizar a referência `main` ou um remote para comprovar que o SHA validado corresponde a
   `latest main`.
2. Disponibilizar `frontend/AGENTS.md` e
   `docs/testing/plans/VAL_STAB_FRONTEND_NODE24_002.md`, caso integrem o contrato da onda, e
   auditar esta evidência contra as instruções ausentes.
3. Avaliar separadamente os avisos de `allowScripts`, configuração `http-proxy` obsoleta e chunk
   acima de `500 kB`; eles não bloquearam os gates desta task.

## Arquivos alterados e estado Git esperado

- Alterado somente `docs/testing/runs/VAL_STAB_FRONTEND_NODE24_002.md`.
- Branch: `node-24-frontend`.
- Após o commit desta evidência, o working tree deve permanecer limpo.
