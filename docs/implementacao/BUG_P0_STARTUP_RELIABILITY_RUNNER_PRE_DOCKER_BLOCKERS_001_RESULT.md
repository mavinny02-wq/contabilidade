# BUG-P0-STARTUP-RELIABILITY-RUNNER-PRE-DOCKER-BLOCKERS-001 result

## Status

`IMPLEMENTADO_ESTRUTURALMENTE_VALIDADO; PESTER5_E_DOCKER_RUNTIME_PENDENTES`

## Baseline

`02b5d23f66c2bb38144ca8c38ac95729a5d1bf59`

## Classificação

`STARTUP_TOOLING_REGRESSION; TEST_CONTRACT_DRIFT; ENVIRONMENT_LIMITATION`

O runner integrado do P0 falhava antes de qualquer operação Docker por três regressões locais e
uma classificação incorreta de dependência:

1. `startup-probe.psm1` recarregava `contabilidade-docker.psm1` com `-Force` dentro do módulo; no
   Windows PowerShell 5.1 isso removia do caller `Invoke-ContabilidadeNativeCommand` e os demais
   exports Docker já importados;
2. o JSON de evidência materializava uma `List[object]` com `@($steps)` dentro de hashtable ordenada,
   combinação que lança `ArgumentException` no Windows PowerShell 5.1 e escondia a causa original;
3. o guard comparava a posição da implementação de `:runtime_preflight`, declarada ao fim do BAT,
   em vez da chamada `call :runtime_preflight` executada antes do wrapper resiliente;
4. o runner tentava tratar Pester 3.4 como compatível usando `-Show`, embora a suíte exija Pester 5
   e use contratos ausentes no Pester 3 (`BeforeAll`, `Should -Throw` e `Should -Not`).

## Correção

- o módulo do probe importa sua dependência sem recarregar/remover os exports do caller;
- os passos são serializados por `List[object].ToArray()`, preservando array vazio ou preenchido;
- o guard valida a chamada real da subrotina antes do startup resiliente;
- Pester anterior à versão 5 agora bloqueia cedo como `ENVIRONMENT_LIMITATION`, antes de invocar a
  suíte com parâmetros ou sintaxe incompatíveis;
- regressões Pester e Node cobrem composição de módulos, materialização PowerShell 5.1, ordem da
  chamada do preflight e versão mínima do Pester.

## Owners alterados

- `scripts/lib/startup-probe.psm1`;
- `scripts/tests/startup-probe.Tests.ps1`;
- `scripts/tests/run-startup-reliability-gate.ps1`;
- `scripts/codex/validate-docker-orchestration.mjs`;
- `scripts/codex/validate-docker-orchestration.test.mjs`;
- este RESULT_MD.

## Locks preservados

- `LOCK-STARTUP-001`: nenhum Docker foi chamado; o runner permanece fail-closed e ainda exige
  Pester, integrações Docker/Compose e duas execuções oficiais no mesmo SHA;
- `LOCK-TEST-001`: Pester 3.4 incompatível foi classificado como limitação de ambiente, sem mudar
  produção para satisfazer falhas de framework;
- `LOCK-EVID-001`: parser, guards e compilação já verdes foram reutilizados; apenas provas focadas
  foram repetidas.

## Validação executável sem Docker ou instalação

- `START_CONTABILIDADE.bat doctor`: parser dos 37 scripts PASS; saída final esperada
  `Docker CLI nao encontrado no PATH`, exit 1;
- composição de módulos em PowerShell: PASS, exports `Invoke-ContabilidadeNativeCommand` e
  `Invoke-ContabilidadeDocker` permanecem disponíveis após importar o probe;
- `node scripts/codex/validate-docker-orchestration.mjs`: PASS;
- `node --test scripts/codex/validate-docker-orchestration.test.mjs`: PASS, 9 testes;
- `scripts/check-contabilidade.ps1 -SkipInstall`: PASS — backend `test-compile`, frontend i18n,
  typecheck/build e worker typecheck/build, sem instalar pacotes e sem Docker;
- runner integrado sem flags Docker: parser, guard e regressões Node PASS; evidência JSON/Markdown
  gerada corretamente e fechamento fail-closed com
  `[ENVIRONMENT_LIMITATION] Pester 5+ e obrigatorio; encontrado 3.4.0`;
- `git diff --check`: executado no fechamento.

## Blocker e menor próximo passo externo

1. disponibilizar Pester 5+ no escopo do usuário e repetir o runner sem flags para executar as
   regressões PowerShell;
2. instalar/reparar o Docker Desktop até `docker`, daemon, Compose v2 e Buildx responderem;
3. no mesmo SHA limpo, executar o runner com `-RunDockerIntegration -RunComposeIntegration
   -RunOfficialStartup` para provar lifecycle real, Compose e duas execuções oficiais.

Não foi feita instalação, chamada LLM, Docker, push ou deploy. O P0 permanece bloqueado conforme
`LOCK-STARTUP-001`; compile/build local não constitui prova runtime.
