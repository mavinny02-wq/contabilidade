# Resultado — FIX_STARTUP_PRIMA_INSPECT_001

## Identificação

- **Item:** `FIX_STARTUP_PRIMA_INSPECT_001`
- **Status:** `CORRIGIDO_ESTRUTURALMENTE_WINDOWS_RUNTIME_PENDENTE`
- **Classificação:** `PRODUCT_REGRESSION`
- **Baseline:** `03fd994d646f3b69c52988276944149e5147c329`
- **Referência comparada:** `mavinny02-wq/euro_rail`, `main` e `release/1.0.0`
- **Migration:** nenhuma

## Falha observada

Após parser, contratos de módulos, daemon e contexto Docker passarem, o startup encerrava no preflight:

```text
[DOCKER_PERMISSION_OR_API_FAILURE]
Nao foi possivel inspecionar o probe 'contabilidade-startup-probe'. Exit code: 64.
```

O comando problemático era construído como array PowerShell:

```text
docker container inspect --format <Go-template-com-\"aspas\"> contabilidade-startup-probe
```

O `\"` é adequado no BAT do PRIMA porque o CMD consome a camada de escape. Em uma chamada nativa por
array no Windows PowerShell 5.1, a barra pode chegar ao Docker. O parser do Go template então rejeita o
argumento e o Docker devolve exit code `64`, que é falha de uso/template, não ausência de container.

## Comparação com PRIMA

O fluxo canônico do PRIMA:

- mantém o preflight read-only em relação aos containers da aplicação;
- valida Docker e Compose sem limpar um probe nomeado;
- só altera a stack depois que os builds e as imagens terminaram;
- usa templates Docker a partir de BAT/CMD, onde a regra de escaping é diferente.

A implementação anterior do Contabilidade havia copiado a grafia `\"` sem copiar a mesma camada de
shell e havia acrescentado cleanup de probe no preflight. Essa combinação não era equivalente ao PRIMA.

## Correções integradas

### Preflight read-only

`scripts/invoke-startup-runtime-preflight.ps1` não cria, inspeciona, para ou remove mais containers da
aplicação. O lifecycle do probe permanece restrito ao startup sequencial, depois dos builds.

### Inspect do probe sem template

`scripts/lib/startup-probe.psm1` executa agora:

```text
docker container inspect <nome>
```

O JSON regular é interpretado com `ConvertFrom-Json`, extraindo somente:

- container ID;
- `State.Status`;
- label exato de ownership.

O caminho produtivo do probe não usa mais `--format` nem aspas embutidas. Ausência continua
idempotente; ownership alheio continua protegido; remoção continua pelo ID imutável.

### Normalização central dos templates restantes

`scripts/lib/contabilidade-docker.psm1` normaliza qualquer argumento `--format` legado que contenha
`\"texto\"`, convertendo-o para literal raw do Go template com delimitador de crase antes da chamada
nativa. A conversão também cobre `--format=<template>` e rejeita escape incompleto.

Isso protege os demais scripts de teste e evidência que ainda possuem templates herdados do BAT,
como inspeção de labels e do volume PostgreSQL.

### Diagnóstico acionável

Uma falha real de inspect/create/remove inclui agora:

- categoria;
- exit code original;
- trecho bounded e redigido do stderr/stdout do Docker.

Exit `64` não será mais apresentado apenas como uma categoria genérica sem a mensagem do Docker.

## Safeguards

Foi criado `scripts/tests/assert-prima-startup-contract.ps1`. Sem Docker Desktop, ele:

- valida a conversão dos templates de label e volume;
- valida as formas `--format <template>` e `--format=<template>`;
- rejeita escape incompleto;
- confirma que o preflight não toca no probe;
- confirma que o probe usa inspect JSON sem `--format`;
- instala temporariamente um `docker.cmd` falso no PATH;
- percorre o executor nativo real do Windows PowerShell;
- prova probe existente, probe ausente e erro real exit `64`;
- falha caso o comando antigo envie argumentos extras.

O workflow Windows `startup-actions.yml` passou a executar esse contrato além do parser recursivo e do
guard de imports/exports.

## Validação disponível

- revisão integral do fluxo oficial de build/start, probe e executor Docker;
- comparação direta com os entrypoints `euro_rail` em `main` e `release/1.0.0`;
- templates normalizados validados pelo parser padrão `text/template` do Go;
- diff limitado a startup, testes, workflow e este resultado;
- nenhum Compose, volume, imagem, banco, migration, dependência ou lockfile alterado.

Esta sessão não possui o Windows PowerShell 5.1 e o Docker Desktop da máquina do usuário. Portanto, a
prova autoritativa final continua sendo o comando oficial no SHA integrado.

## Prova após o merge

```powershell
git switch main
git pull --ff-only
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\tests\assert-startup-powershell-contract.ps1
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\tests\assert-prima-startup-contract.ps1
.\START_CONTABILIDADE.bat doctor
.\START_CONTABILIDADE.bat dev
```

Saída inicial esperada:

```text
[OK] Preflight PowerShell: <N> script(s) validado(s).
[OK] Contratos dos modulos de startup validados.
[STARTUP-PREFLIGHT] Validando Docker CLI, daemon, Compose e Buildx...
[OK] Docker daemon disponivel.
[STARTUP-PREFLIGHT] Contexto Docker preservado: desktop-linux
[STARTUP-PREFLIGHT] Read-only: nenhum container da aplicacao foi criado, inspecionado, parado ou removido.
```

O inspect do probe ocorrerá somente depois do build, no startup sequencial, usando JSON regular.
