# VAL-STAB-WORKER-001 — validação de estabilidade do worker

## Identificação

- **Task:** `VAL-STAB-WORKER-001`
- **Branch preparada:** `worker-validation`
- **Baseline disponível:** `7c6079caa54d1e7526a3e03c5ee41893581ff9b1`
- **Data da execução (UTC):** `2026-08-16`
- **Escopo:** `automation-worker/**` somente leitura; este relatório é a única alteração intencional
- **Locks preservados:** `LOCK-EXT-001`, `LOCK-COST-001`, `LOCK-DATA-001`, `LOCK-AUT-001` e `LOCK-TEST-001`
- **Migration:** nenhuma

## Entradas lidas

- `AGENTS.md` da raiz;
- `automation-worker/package.json`;
- fontes e testes alcançados indiretamente pelos comandos TypeScript e Node.js.

As entradas solicitadas `automation-worker/AGENTS.md` e
`docs/testing/MASTER_TEST_ORCHESTRATION.md` não existem no baseline disponível. Portanto, não foi
possível lê-las; a validação seguiu as instruções do `AGENTS.md` da raiz e o comando explícito da
task.

## Ambiente

- Node.js: `v20.20.2`;
- npm: `11.4.2`;
- requisito declarado pelo worker: Node.js `>=22.12.0`;
- download de browsers desabilitado com `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`.

## Validação executada

Comando solicitado, iniciado em `automation-worker/`:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --no-audit --no-fund && npm run typecheck && npm test && npm run build
```

Resultados por etapa:

| Etapa | Resultado | Evidência resumida |
|---|---|---|
| `npm ci --no-audit --no-fund` | aprovado com advertências | 50 pacotes instalados; npm emitiu `EBADENGINE` porque Node.js 20 não atende ao requisito do projeto nem ao de `pdfjs-dist` |
| `npm run typecheck` | aprovado | `tsc -p tsconfig.json --noEmit` concluiu sem erro |
| `npm test` | reprovado por limitação do ambiente | 6 testes aprovados e 1 reprovado; o executável Chromium `chromium_headless_shell-1223` não está instalado no cache Playwright |
| `npm run build` final | não alcançado | a cadeia `&&` foi interrompida pela reprovação de `npm test`; o build interno executado pelo próprio script de teste concluiu antes da suíte |

O caso reprovado foi `smoke Playwright permite somente páginas locais e fecha recursos`. A falha
ocorreu ao iniciar o browser e informou que o executável esperado não existe em
`/root/.cache/ms-playwright/chromium_headless_shell-1223/`. Não houve chamada a portal fiscal,
uso de credencial real, alteração de dados autoritativos ou tentativa de contornar CAPTCHA.

## Resultado

**BLOQUEADO POR AMBIENTE.** A instalação reproduzível, a checagem de tipos, o build TypeScript
interno e seis testes foram comprovados. A suíte completa e, por consequência, o build final da
cadeia não foram comprovados porque o browser foi deliberadamente omitido da instalação e não
estava previamente disponível. O Node.js do executor também está abaixo da versão suportada.

## Comportamento preservado

Nenhum arquivo de produção, teste, lockfile, dependência, configuração, migration ou artefato
autoritativo foi alterado. Os diretórios gerados `automation-worker/node_modules/` e
`automation-worker/dist/` permanecem ignorados pelo Git. Estados fiscais desconhecidos,
indisponíveis e não consultados não foram avaliados nem reclassificados.

## Pendências para validação verde

1. Reexecutar em Node.js `>=22.12.0` (e compatível com o requisito efetivo de `pdfjs-dist`).
2. Disponibilizar previamente o Chromium correspondente ao Playwright `1.60.0`, sem remover
   `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` do comando contratado, ou executar em imagem que já o
   contenha.
3. Reexecutar a cadeia completa e comprovar os sete testes e o `npm run build` final.
4. Disponibilizar no baseline as duas entradas documentais solicitadas ou confirmar formalmente
   que não se aplicam a esta execução.
