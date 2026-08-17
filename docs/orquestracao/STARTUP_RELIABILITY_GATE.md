# Gate P0 de confiabilidade do startup Windows/Compose

**ID:** `CONTABILIDADE_STARTUP_RELIABILITY_GATE_P0_001`  
**Classificação:** `CANONICAL_ACTIVE_RUNTIME_GATE`  
**Estado:** `BLOCKING`  
**Ambiente autoritativo:** Windows PowerShell 5.1 + Docker Desktop em contexto ativo preservado

## Objetivo

Tornar o comando oficial abaixo repetível e confiável, sem descobrir um novo defeito somente depois
de reconstruir todos os artefatos:

```powershell
.\START_CONTABILIDADE.bat dev
```

O gate cobre build, verificação de imagens, startup sequencial, readiness, cleanup, falha, retry
permitido e segunda execução. Ele não é fechado por inspeção estática, execução Linux ou sucesso
isolado dos componentes.

## Diagnóstico estrutural atual

O fluxo possui três camadas:

```text
START_CONTABILIDADE.bat
  -> start-contabilidade-resilient.ps1
     -> start-contabilidade-core.bat
        -> start-compose-sequential.bat
           -> start-compose-sequential.ps1
```

O wrapper resiliente trata corretamente alguns erros de registry e BuildKit, mas o script sequencial
mantém invocações nativas diretas. Com `$ErrorActionPreference = 'Stop'`, stderr legítimo de um
comando Docker esperado pode ser convertido em `NativeCommandError` antes da avaliação do exit code.

A ausência de `contabilidade-startup-probe` é um estado normal em primeira execução, cleanup anterior
ou corrida concorrente. Ela não pode interromper o startup.

## Contrato obrigatório de implementação

### 1. Um único executor nativo

Todos os comandos Docker usados pelo startup devem passar por
`Invoke-ContabilidadeNativeCommand`/`Invoke-ContabilidadeDocker`, ou por uma abstração única que
preserve exatamente estas propriedades:

- stdout e stderr capturados separadamente;
- exit code como única autoridade de sucesso;
- nenhuma conversão prematura para `NativeCommandError`;
- redaction de conteúdo sensível;
- resultado estruturado com `Success`, `ExitCode`, `StdOut`, `StdErr` e `Output`;
- comportamento idêntico em Windows PowerShell 5.1 e PowerShell 7.

Invocações diretas `& docker ...` em scripts de startup são proibidas, exceto dentro do executor
nativo central e de testes de integração explicitamente isolados.

### 2. Classificação de falhas

O fluxo deve distinguir pelo menos:

```text
CONTAINER_ABSENT_EXPECTED
CONTAINER_REMOVED
CONTAINER_RUNNING_REMOVED
CONCURRENT_REMOVAL_EXPECTED
IMAGE_AVAILABLE
IMAGE_MISSING
DOCKER_DAEMON_UNAVAILABLE
DOCKER_PERMISSION_OR_API_FAILURE
PROBE_NAME_OWNERSHIP_CONFLICT
PROBE_CREATE_FAILED
PROBE_REMOVE_FAILED
```

`No such container` só é sucesso quando o comando e o recurso esperado permitem ausência. A mesma
mensagem não deve tornar todo erro Docker silencioso.

### 3. Ownership seguro do probe

O probe deve ser identificável por nome e label project-scoped. Antes de remover um container
existente com o mesmo nome, o fluxo deve comprovar que ele pertence ao startup do Contabilidade.
Container com nome igual e label inesperado é `PROBE_NAME_OWNERSHIP_CONFLICT`, não alvo de remoção
forçada.

### 4. Cleanup idempotente e race-safe

O cleanup deve funcionar quando o probe:

1. não existe;
2. existe e está parado;
3. existe e está em execução;
4. desaparece entre inspect e remove;
5. já foi removido por um `finally` anterior.

O desenho não pode depender apenas de `inspect` seguido de `rm`, pois existe uma race entre os dois.
A tentativa de remoção deve classificar `No such container` como ausência concorrente esperada.

### 5. Sem mascarar a causa original

No `finally`:

- se a operação principal já falhou, uma falha de cleanup deve ser anexada ou registrada sem apagar
  a causa original;
- se a operação principal passou, falha real de cleanup deve deixar a execução vermelha;
- ausência esperada nunca deve mascarar sucesso ou falha;
- o log deve preservar comando lógico, categoria, exit code e caminho do log, sem segredo.

## Pirâmide obrigatória de testes

### Camada A — parser e contratos estáticos

- todos os `.ps1`/`.psm1` parseados pelo Windows PowerShell 5.1;
- guard rejeita `& docker` fora do módulo autorizado;
- guard rejeita cleanup baseado somente em redirecionamento de stderr;
- guard exige label do probe, cleanup no início e no `finally`;
- guard exige que preflight ocorra antes de Maven/npm/build.

### Camada B — Pester com Docker simulado

Cobertura mínima:

| Cenário | Resultado obrigatório |
|---|---|
| probe inexistente | sucesso idempotente, sem exception |
| probe parado | removido e confirmado ausente |
| probe running | removido e confirmado ausente |
| remoção concorrente | sucesso classificado como ausência esperada |
| imagem existente | verificação passa |
| imagem ausente | falha `IMAGE_MISSING` |
| daemon indisponível | falha `DOCKER_DAEMON_UNAVAILABLE` |
| erro real de remoção | falha `PROBE_REMOVE_FAILED` |
| primeira execução | cleanup inicial não bloqueia criação/startup |
| execução repetida | não há conflito, probe órfão ou falso erro |

Também devem existir testes para ownership conflict, falha de criação, falha de inspect, cleanup no
`finally` e preservação da exception original.

### Camada C — semântica nativa no PowerShell 5.1

Executar um processo sintético que:

- escreve em stderr e retorna `0`;
- escreve em stderr e retorna código não zero;
- escreve simultaneamente em stdout/stderr;
- produz volume suficiente para testar deadlock;
- usa caminho com espaços.

O teste deve provar que stderr não encerra o script antes de o exit code ser classificado.

### Camada D — integração real do lifecycle Docker

Em Docker Desktop real, usando somente recursos de teste identificados por label:

- cleanup com probe ausente;
- cleanup de probe parado;
- cleanup de probe running;
- remoção concorrente;
- conflito de nome com label alheio;
- imagem de teste existente e ausente;
- daemon indisponível ou contexto inválido classificado sem apagar recursos;
- falha real de create/remove reproduzida por fixture segura;
- nenhum container de teste restante ao final.

Essa camada não usa o banco ou volumes reais do projeto.

### Camada E — startup Compose end-to-end

O harness deve usar um `COMPOSE_PROJECT_NAME` único, portas temporárias e volumes exclusivos de teste.
É permitido remover volumes apenas desse projeto efêmero, comprovado pelo prefixo/label.

Primeira execução:

1. imagens runtime já disponíveis;
2. probe inicialmente ausente;
3. PostgreSQL pronto;
4. backend readiness HTTP 200;
5. worker `/health` HTTP 200;
6. frontend `/healthz` HTTP 200;
7. proxy `/api/info` HTTP 200;
8. Flyway V12 íntegro;
9. marker sintético persistido no PostgreSQL;
10. probe ausente ao final.

Execução repetida:

1. mesmo projeto Compose;
2. PostgreSQL e volume reutilizados;
3. marker sintético preservado;
4. backend, worker e frontend novamente saudáveis;
5. nenhum Keycloak/bootstrap no modo dev;
6. nenhum probe órfão;
7. zero chamada externa.

Falha injetada:

- serviço controlado não fica ready;
- logs focados são coletados;
- exit code é não zero;
- causa raiz permanece visível;
- cleanup remove somente probe e recursos efêmeros autorizados;
- banco/volume não são apagados pelo startup oficial.

## Evidência obrigatória

A execução real deve produzir JSON e Markdown contendo:

```text
Git SHA
modo
PowerShell/Docker/Compose versions
contexto Docker preservado
IDs dos containers antes/depois
classificações de cleanup
health/readiness
Flyway frontier
probe final state
PostgreSQL reuse
exit codes
durações
paths dos logs redigidos
```

São proibidos `.env`, senhas, tokens, chaves, conteúdo de documentos e payloads fiscais.

## Critério de saída

O gate só recebe `PASS` quando:

- parser/guards passam;
- Pester passa no Windows PowerShell 5.1;
- integração real do lifecycle Docker passa;
- startup dev completo passa;
- startup dev repetido passa;
- PostgreSQL é reutilizado;
- probe não permanece;
- nenhuma falha é tratada apenas por esconder stderr;
- evidência está pinada ao SHA integrado.

Até lá:

```text
NEW_WAVE_SELECTION = DENIED
FUNCTIONAL_FEATURE_SELECTION = DENIED
ONPREMISE_KEYCLOAK = BLOCKED
STARTUP_FIX_DONE = FALSE
```

`CONTABILIDADE_STARTUP_RELIABILITY_GATE_P0_001_BLOCKING`
