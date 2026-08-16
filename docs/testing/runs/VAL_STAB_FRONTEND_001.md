# VAL-STAB-FRONTEND-001 — estabilidade do frontend

## Identificação

| Campo | Valor |
|---|---|
| Task | `VAL-STAB-FRONTEND-001` |
| Data da execução | `2026-08-16` (UTC) |
| Branch preparada | `frontend-validation` |
| Baseline disponível | `7c6079caa54d1e7526a3e03c5ee41893581ff9b1` |
| Descrição do baseline | `Merge PR #55: isola BuildKit e separa deploy sem build` |
| Escopo | `frontend/**` somente leitura; este relatório é a única alteração persistente |
| Locks respeitados | `LOCK-EXT-001`, `LOCK-DATA-001`, `LOCK-TEST-001`, `LOCK-EVID-001` |
| Migration | nenhuma |
| Classificação | **APROVADO COM RESSALVA AMBIENTAL** |

## Entradas lidas e disponibilidade

- `AGENTS.md`: lido e aplicado.
- `frontend/AGENTS.md`: não existe no baseline disponível.
- `docs/testing/MASTER_TEST_ORCHESTRATION.md`: não existe no baseline disponível.
- `frontend/package.json` e `frontend/package-lock.json`: consultados para conferir scripts,
  engines e reprodutibilidade da instalação.

O repositório fornecido não possui remote Git nem referência local `main`; havia somente a branch
`work` apontando para o commit acima. Portanto, não foi possível buscar ou comparar `latest main`.
A branch solicitada foi preparada diretamente a partir do HEAD disponibilizado, sem alterar o
baseline.

## Ambiente

- Sistema: `Linux 6.18.35 x86_64`.
- Node.js: `v20.20.2`.
- npm: `11.4.2`.
- Engine declarado pelo frontend: Node.js `>=22.12.0` e npm `>=10`.
- SHA-256 de `frontend/package-lock.json`:
  `dde31434421200291966471c9277f13bd0f66842a861ad0e63701d26f12fa709`.

O npm utilizado satisfaz o engine declarado, mas o Node.js disponível não satisfaz
`>=22.12.0`. A instalação emitiu `EBADENGINE`; mesmo assim, todos os comandos solicitados
terminaram com código `0`. A ressalva impede interpretar esta execução como prova no runtime Node
oficialmente suportado.

## Validações executadas

| Ordem | Comando | Código | Resultado |
|---:|---|---:|---|
| 1 | `cd frontend && npm ci --no-audit --no-fund` | `0` | 232 pacotes instalados a partir do lockfile; aviso `EBADENGINE` pelo Node.js 20 |
| 2 | `cd frontend && npm run locale:validate` | `0` | bundle `pt-BR` válido; 22 catálogos, 64 arquivos e 86 entradas dinâmicas verificados |
| 3 | `cd frontend && npm run typecheck` | `0` | TypeScript sem erro |
| 4 | `cd frontend && npm test` | `0` | 7 arquivos e 20 testes aprovados |
| 5 | `cd frontend && npm run build` | `0` | build Vite concluído; 152 módulos transformados |

O build produziu `dist/index.html`, CSS e JavaScript. O Vite alertou que o chunk JavaScript
minificado tem `543,27 kB`, acima do limiar padrão de `500 kB`; trata-se de aviso de tamanho, não
de falha. Os artefatos gerados são ignorados pelo Git.

## Resultado e comportamento preservado

- A instalação bloqueada, a integridade do catálogo `pt-BR`, a tipagem, a suíte automatizada e o
  build de produção passaram no baseline disponibilizado.
- Nenhum código, teste, dependência, lockfile, configuração, dado ou migration foi alterado.
- Nenhuma integração externa, operação fiscal, acesso a documento ou mutação de banco foi
  executada.
- O arquivo incremental rastreado `frontend/tsconfig.app.tsbuildinfo`, atualizado pelos comandos
  TypeScript, foi restaurado ao conteúdo do baseline para manter `frontend/**` somente leitura.

## Pendências e ressalvas

1. Repetir o gate com Node.js `>=22.12.0`, conforme `frontend/package.json`, para remover a
   ressalva de engine.
2. Disponibilizar a referência `main` ou um remote para comprovar que o SHA validado corresponde a
   `latest main`.
3. Disponibilizar `frontend/AGENTS.md` e
   `docs/testing/MASTER_TEST_ORCHESTRATION.md`, caso façam parte do contrato desta onda, e auditar
   esta execução contra as instruções ausentes.
4. Avaliar separadamente o aviso de chunk acima de `500 kB`; ele não bloqueou o build desta task.

## Arquivos alterados e estado Git esperado

- Alterado somente `docs/testing/runs/VAL_STAB_FRONTEND_001.md`.
- Branch: `frontend-validation`.
- Após o commit desta evidência, o working tree deve permanecer limpo.
