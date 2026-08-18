# FIX-STARTUP-PROBE-001 — resultado

## Identificação

- **ITEM:** `FIX-STARTUP-PROBE-001`
- **Wave:** `CONTABILIDADE_STARTUP_RECOVERY_WAVE_013`
- **Baseline:** `2bb57f94cdb93a2a36e21482e84933158b8aed7b`
- **Status:** `IMPLEMENTED_STRUCTURAL_PASS_WINDOWS_RUNTIME_PENDING`
- **Migration:** nenhuma
- **Providers externos:** não utilizados
- **Dados reais:** não utilizados
- **PR:** `#137`

## Causa raiz corrigida

O startup sequencial executava Docker diretamente sob `$ErrorActionPreference = 'Stop'` e usava redirecionamento de streams como mecanismo de tolerância. No Windows PowerShell 5.1, o stderr legítimo de `docker rm -f contabilidade-startup-probe` quando o container não existe podia ser promovido a `NativeCommandError` antes da leitura de `$LASTEXITCODE`.

O fluxo também removia o probe apenas pelo nome, não comprovava ownership por label e não possuía testes de primeira execução, execução repetida, corrida de remoção ou falha real.

## Implementação

### Preflight antes do build

O BAT oficial agora executa `scripts/invoke-startup-runtime-preflight.ps1` antes do wrapper resiliente. O preflight:

- usa o parser real de todos os `.ps1`/`.psm1` operacionais;
- valida Docker CLI, daemon, Compose e Buildx;
- preserva o contexto Docker ativo;
- remove um probe stale de forma idempotente;
- falha antes de Maven, npm ou Docker build quando há erro estrutural, daemon indisponível ou conflito de ownership.

### Executor Docker único

`start-compose-sequential.ps1`, o lifecycle do probe e a verificação estruturada das imagens usam o contrato de `contabilidade-docker.psm1`:

```text
Success
ExitCode
StdOut
StdErr
Output
```

O exit code nativo é a autoridade. Os scripts operacionais alterados não dependem de `2>$null`, `*>$null` ou swallow genérico para transformar falha em sucesso.

### Probe idempotente e seguro

O probe recebe o label:

```text
contabilidade.local.startup-probe=true
```

O cleanup:

- aceita probe ausente;
- remove probe parado ou running;
- remove pelo container ID inspecionado, não pelo nome mutável;
- aceita desaparecimento concorrente;
- recusa container de mesmo nome com label alheio;
- mantém daemon, permissão e falha de API como erro real;
- preserva a falha principal quando o cleanup também falha.

### Verificação das imagens e transição

`start-compose-sequential.bat` executa `verify-runtime-images.ps1` antes do Compose e imprime uma transição explícita. O verificador diferencia:

```text
RUNTIME_IMAGE_VERIFIED
IMAGE_MISSING
DOCKER_CLI_UNAVAILABLE
DOCKER_DAEMON_UNAVAILABLE
DOCKER_PERMISSION_OR_API_FAILURE
RUNTIME_IMAGE_VALIDATION_FAILED
```

### Testes e harnesses adicionados

- Pester de classificação Docker e imagens runtime;
- Pester de probe ausente, parado, running, corrida, conflito, primeira e segunda criação, falha de create/remove e cleanup;
- prova de stderr/exit code/caminhos com espaços/alto volume no Windows PowerShell;
- lifecycle Docker real com recursos rotulados e cleanup bounded;
- Compose efêmero com portas e project name únicos, primeira e segunda execução, Flyway V12, marker PostgreSQL, health checks, ausência de Keycloak no dev e falha controlada;
- runner único `run-startup-reliability-gate.ps1` com JSON e Markdown redigidos;
- workflow Windows estrutural e job manual self-hosted para Docker Desktop.

## Validação executada neste executor

| Validação | Resultado |
|---|---|
| `node --check scripts/codex/validate-docker-orchestration.mjs` | `PASS` |
| `node --test scripts/codex/validate-docker-orchestration.test.mjs` | `PASS`, 6/6 |
| fixture integrada do guard com os novos contratos | `PASS` |
| varredura de invocação Docker direta nos scripts PowerShell operacionais alterados | `PASS`, zero findings |
| varredura de interpolação PowerShell ambígua | `PASS`, zero findings |
| sanity lexical de delimitadores/strings/here-strings | `PASS_NON_AUTHORITATIVE` |

## Limitação de ambiente

Este executor não possui Windows PowerShell, Pester, Docker Engine ou Docker Desktop. Portanto, não foi alegado `PASS` para:

- parser autoritativo no Windows PowerShell 5.1;
- Pester;
- lifecycle Docker real;
- Compose E2E;
- primeiro e segundo `START_CONTABILIDADE.bat dev`.

Essas provas pertencem à próxima campanha focada `VAL-WINDOWS-COMPOSE-STARTUP-001`, pinada ao SHA integrado.

## Segurança e não destrutividade

- nenhum volume, banco, documento, backup ou cache global foi removido;
- o harness só permite `down --volumes` para project name `contabilidade-startup-it-*`;
- containers de integração recebem labels por suite e run ID;
- cleanup recusa recurso sem ownership comprovado;
- nenhuma credencial, `.env`, payload fiscal ou dado pessoal é gravado na evidência;
- nenhuma migration, dependência de produto ou provider foi alterado.

`FIX_STARTUP_PROBE_001_IMPLEMENTED_RUNTIME_VALIDATION_PENDING`
