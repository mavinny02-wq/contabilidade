# PRIMA × Contabilidade — infraestrutura e startup

**Referência PRIMA:** `mavinny02-wq/euro_rail`, branch `release/1.0.0`  
**Contabilidade analisado:** `main` após PRs `#137` e `#138`  
**Classificação:** análise de arquitetura operacional; não é prova Windows runtime

## Elementos equivalentes

As duas aplicações seguem o mesmo princípio operacional:

- compilação dos componentes no host;
- contextos Docker contendo somente artefatos runtime;
- imagens finais carregadas no Docker local;
- Compose iniciado com `--no-build`;
- contexto Docker selecionado pelo usuário preservado;
- DNS/proxy sob autoridade do Docker Desktop/daemon;
- nenhuma troca global de builder/contexto;
- nenhum prune global ou remoção de volume no caminho normal;
- verificação de imagem antes da transição para startup.

## Diferenças que explicavam a fragilidade

| Tema | PRIMA | Contabilidade antes desta mudança |
|---|---|---|
| Nome do fluxo | build/start explícito | `START_CONTABILIDADE.bat dev` parecia apenas start, mas compilava tudo |
| Ações locais | operação intencional por etapa | build, image build e Compose acoplados no mesmo caminho |
| Diagnóstico | preflight e falha antes da mutação | operador só descobria vários erros durante o comando de subida |
| Contexto de agentes | budgets e guards executáveis | política HOT/WARM/COLD apenas conceitual |
| Tokens | profiler separa actual/estimate | não havia profiler determinístico equivalente |
| Startup probe | lifecycle testado e ownership explícito | corrigido somente na PR `#137` |
| Gate remoto | deve impedir regressão | branch `main` ainda sem proteção e runs remotas não comprovadas |

## Por que aparece erro de compilação "ao subir"

O erro não é produzido pelo Docker Compose. O comando histórico executa, nesta ordem:

```text
Maven package
npm ci + i18n + typecheck + build do frontend
npm ci + typecheck + build do worker
criação e verificação das imagens
startup sequencial do Compose
```

Logo, qualquer erro Java ou TypeScript ocorre antes de a stack ser iniciada, mas aparece dentro da
mesma janela chamada `START_CONTABILIDADE`. Isso confundia três diagnósticos diferentes:

1. defeito de compilação do produto;
2. defeito de construção/verificação da imagem;
3. defeito de runtime/Compose.

Sem o log específico do compilador não é correto afirmar qual fonte Java/TypeScript está quebrada.
A correção arquitetural é separar os comandos e preservar o exit code de cada fase.

## Contrato novo

```text
START_CONTABILIDADE.bat doctor
  diagnóstico read-only de toolchain, Docker, Compose e imagens

START_CONTABILIDADE.bat check
  compilação/typecheck/build dos três componentes; não toca Docker Compose

START_CONTABILIDADE.bat build
  check + contextos/imagens runtime; não inicia Compose

START_CONTABILIDADE.bat start
  usa imagens existentes; não executa Maven, npm, typecheck ou docker build

START_CONTABILIDADE.bat dev
  compatibilidade: build + start
```

Dessa forma:

- falha em `check` é produto/toolchain;
- falha em `build` é artefato/imagem/registry/BuildKit;
- falha em `start` é Docker/Compose/readiness/runtime;
- `doctor` informa pré-condições sem alterar containers.

## Safeguards adicionados

- guard Node rejeita Maven/npm/docker build no caminho `start`;
- guard rejeita Docker no caminho `check`;
- guard rejeita build/start/pull/cleanup no `doctor`;
- core encerra `build-only` antes da chamada ao Compose;
- workflow Windows valida contratos e parser PowerShell 5.1;
- `dev` permanece compatível para quem deseja o fluxo completo.

## Limitação honesta

A separação reduz a superfície de diagnóstico e impede que um start puro recompile o sistema. Ela
não comprova que o HEAD sobe no Windows do usuário. O fechamento exige:

1. `doctor` verde;
2. `check` verde;
3. `build` verde;
4. `start` verde duas vezes;
5. PostgreSQL reutilizado;
6. probe ausente ao final;
7. evidência pinada ao mesmo SHA.
