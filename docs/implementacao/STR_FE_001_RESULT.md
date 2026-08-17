# STR-FE-001 — acessibilidade e browser smoke

- **ITEM:** `STR-FE-001`
- **Baseline:** `9d5561e545e502c78be88ec06a5e4291ccc449f9` (latest main disponibilizada no checkout; contém o dispatch baseado em `d4c5391`)
- **Status:** `PASS`
- **Owners alterados:** shell/navegação, modal, estilos de contraste, testes frontend e configuração browser; este resultado.
- **Migration:** nenhuma.

## Resultado

- O shell oferece landmark de navegação nomeado, skip link para o conteúdo principal e estado expandido do menu móvel.
- O modal recebe foco inicial, contém a navegação por Tab/Shift+Tab, fecha por Escape e devolve foco ao acionador.
- A cor de texto secundária foi ajustada para eliminar a violação séria de contraste observada pelo axe nas rotas representativas.
- O smoke Playwright cobre Visão Geral, Empresas, Documentos, Certidões e Console Técnica, bloqueia origens externas, usa identidade sintética local e rejeita violações axe `critical`/`serious`.
- Foram adicionadas somente dependências de desenvolvimento pinadas: `@playwright/test` 1.55.0 (Apache-2.0) e `@axe-core/playwright` 4.10.2 (MPL-2.0), necessárias à prova browser automatizada. Não há dependência de runtime nova.

## Locks preservados

- `LOCK-DATA-001`: o smoke usa apenas identidade e permissões sintéticas, sem credenciais ou dados reais.
- `LOCK-EVID-001`: os reruns foram focados após classificar e corrigir os achados observados.
- `LOCK-TEST-001`: a coleta inicial do browser revelou `PRODUCT_REGRESSION` de contraste (4,44:1) e `TEST_CONTRACT_DRIFT` na descoberta Vitest; ambos foram corrigidos de forma bounded.

## Validação

| Comando | Resultado |
|---|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_FAST_LANE_WAVE_007 --item STR-FE-001 --baseline d4c5391ebcf44b9fc7d3a7db7a488a5e7564889b --key 8879bbc739dfa5cc339b4150f6650bcdd854190bc864bdd00db987941bd85d29 --github-aware --register` | `PASS` local; auditoria GitHub indisponível por ausência de variáveis no checkout |
| `npm run locale:validate` | `PASS` — 22 catálogos, 66 arquivos e 86 entradas dinâmicas |
| `npm run typecheck` | `PASS` |
| `npm test` | `PASS` — 8 arquivos, 24 testes |
| `npm run build` | `PASS` |
| `npm run test:a11y` | `PASS` — 6 testes Chromium, zero violação critical/serious nas páginas cobertas |
| `git diff --check` | `PASS` |

Todos os comandos Node foram executados com Node `v24.19.0`. O browser smoke efetuou somente chamadas ao host local; endpoints locais sem backend responderam com falha controlada e nenhuma chamada a provider externo foi realizada.

## Limitações e provas pendentes

A prova browser é um smoke local com Chromium e identidade sintética; não constitui prova de backend, banco, provider fiscal, dados reais, runtime Windows ou Docker Desktop. Os endpoints de dados locais não estavam disponíveis, portanto os estados de falha controlada das páginas foram analisados pelo axe.

## Commit e PR

Preenchidos no handoff Git/GitHub desta entrega.
