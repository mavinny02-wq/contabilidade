# VAL-STAB-WORKER-NODE24-PW-002 — Node.js 24 e Playwright

## Identificação

- **Task:** `VAL-STAB-WORKER-NODE24-PW-002`;
- **Baseline disponível:** `4c07f16a8a66abb76983c9203c8e694c748f0af0`;
- **Branch de execução:** `work`;
- **Data da execução (UTC):** `2026-08-16`;
- **Escopo:** `automation-worker/**` somente leitura; este relatório é a única alteração
  intencional;
- **Locks preservados:** `LOCK-EXT-001`, `LOCK-COST-001`, `LOCK-DATA-001`,
  `LOCK-AUT-001` e `LOCK-TEST-001`;
- **Migration:** nenhuma.

## Entradas lidas

- `AGENTS.md` da raiz;
- `automation-worker/package.json`;
- `automation-worker/package-lock.json`;
- `automation-worker/.npmrc`;
- `automation-worker/src/worker.test.ts`;
- fontes alcançadas pela compilação e pela suíte do worker.

As entradas solicitadas `automation-worker/AGENTS.md` e
`docs/testing/plans/VAL_STAB_WORKER_NODE24_PW_002.md` não existem no baseline disponível. A
validação seguiu, portanto, as instruções do `AGENTS.md` da raiz e o contrato explícito da task.
O repositório também não possui remoto nem referência local `main`; por isso, o commit corrente,
que já era o único baseline disponibilizado, foi usado sem alteração.

## Preparação do ambiente

- Node.js `v24.19.0` instalado com `mise` e selecionado por `PATH` explícito;
- npm `11.17.0`;
- dependências reproduzidas por `npm ci --no-audit --no-fund`;
- Playwright `1.60.0`, conforme o lockfile;
- Chromium for Testing `148.0.7778.96`, revisão Playwright `1223`, incluindo o headless shell e
  as bibliotecas de sistema requeridas, instalado antes do bloqueio de rede da validação.

A instalação inicial feita por meio de `mise exec node@24` herdou o `PATH` do NVM e, apesar de o
npm ser o distribuído com Node.js 24, executou seu shebang com Node.js 20. Essa tentativa de
preparação não foi considerada evidência. A execução válida fixou diretamente o diretório
`$(mise where node@24)/bin` no início do `PATH` e confirmou `node=v24.19.0`.

## Isolamento de rede da validação

Durante `typecheck`, `test` e `build`, o processo recebeu `HTTP_PROXY`, `HTTPS_PROXY` e
`ALL_PROXY` apontando para `127.0.0.1:9`, manteve apenas loopback em `NO_PROXY` e usou
`npm_config_offline=true`. Assim, nenhuma etapa validada podia buscar pacote ou acessar fonte
externa pela configuração do processo. O smoke test também comprovou que o runtime aceita a
página local sintética e rejeita `https://example.invalid/nao-acessar`.

## Validação executada

Com Node.js 24 explicitamente selecionado e o bloqueio de rede descrito acima, foram executados
em `automation-worker/`:

```bash
npm run typecheck
npm test
npm run build
```

| Etapa | Resultado | Evidência resumida |
|---|---|---|
| `npm run typecheck` | aprovado | `tsc -p tsconfig.json --noEmit` concluiu sem erros |
| `npm test` | aprovado | 7 testes aprovados, 0 reprovados, 0 ignorados |
| smoke Chromium | aprovado | Chromium revision `1223` abriu conteúdo local, recusou a navegação externa e encerrou recursos |
| `npm run build` | aprovado | `tsc -p tsconfig.json` concluiu sem erros após a suíte |

Uma primeira tentativa do teste, anterior à instalação das bibliotecas de sistema do Chromium,
teve 6 aprovações e 1 falha de ambiente por ausência de `libatk-1.0.so.0`. Após executar a
preparação completa do Chromium, a cadeia final acima ficou integralmente verde; a falha
preliminar não indica defeito do worker.

## Resultado

**APROVADO.** O worker passou por checagem de tipos, pelos sete testes e pelo build com Node.js
24.x e o Chromium correspondente ao Playwright bloqueado no lockfile. A execução final ocorreu
sem acesso à rede externa.

## Comportamento preservado

Nenhum arquivo de produção, teste, lockfile, dependência declarada, configuração, migration ou
dado autoritativo foi alterado. `automation-worker/node_modules/` e `automation-worker/dist/`
foram apenas artefatos locais ignorados pelo Git. Não houve acesso a portal fiscal, uso de
credencial real, custo externo, alteração de dados, contorno de CAPTCHA ou ação fiscal
autoritativa. A distinção entre estados fiscais desconhecidos, indisponíveis e não consultados
permaneceu intacta.

## Pendências

- Disponibilizar em baseline futuro `automation-worker/AGENTS.md` e
  `docs/testing/plans/VAL_STAB_WORKER_NODE24_PW_002.md`, ou confirmar formalmente que essas
  entradas não se aplicam.
- Disponibilizar a referência `main` ou um remoto se a comparação literal com `latest main` for
  obrigatória em uma reexecução.

