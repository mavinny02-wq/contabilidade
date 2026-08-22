# Resultado — FIX_STARTUP_MODULE_CONTRACT_001

## Identificação

- **Item:** `FIX_STARTUP_MODULE_CONTRACT_001`
- **Status:** `CORRIGIDO_ESTRUTURALMENTE_WINDOWS_RUNTIME_PENDENTE`
- **Classificação:** `PRODUCT_REGRESSION`
- **Baseline:** `66d6b4846eecd5089331849245c8399261146400`
- **Owner:** imports, exports, parser e referências de comandos do fluxo PowerShell de startup.
- **Migration:** nenhuma.

## Falha reproduzida pelo usuário

O parser concluiu os 37 arquivos, mas o entrypoint falhou antes de Maven/npm/build:

```text
Assert-ContabilidadeDockerAvailable : comando não reconhecido
scripts/invoke-startup-runtime-preflight.ps1
```

A função existe e é exportada por `contabilidade-docker.psm1`. O defeito estava no carregamento seguinte:
`startup-probe.psm1` executava `Import-Module contabilidade-docker.psm1 -Force` de dentro de outro
módulo. Esse reload aninhado removia do estado de sessão do chamador os comandos Docker já importados.
O mesmo risco existia no preflight e no startup sequencial, pois ambos carregam Docker e probe.

## Correções

- O probe não força mais o reload da dependência Docker.
- O módulo do probe valida, ao carregar, as três funções Docker que usa internamente.
- O preflight valida todos os arquivos indispensáveis do encadeamento oficial.
- Antes de tocar Docker, Maven, npm ou build, o preflight valida exports e visibilidade de:
  - `startup-preflight`;
  - `contabilidade-docker`;
  - `startup-probe`;
  - `native-process`.
- Foi criado `scripts/tests/assert-startup-powershell-contract.ps1`, que:
  - reproduz a ordem real de imports;
  - repete o import do probe duas vezes;
  - garante que comandos irmãos não desaparecem;
  - parseia todos os `.ps1` e `.psm1`;
  - inspeciona a AST e rejeita comandos de projeto sem definição local ou export conhecido;
  - não invoca Docker.
- O teste Pester antigo deixou de fixar incorretamente a linha do erro em `1`; agora exige arquivo,
  linha e coluna válidos em qualquer parser compatível.
- O workflow Windows passou de dois arquivos para todo o subtree `scripts/**` e executa o contrato de
  módulos no Windows PowerShell 5.1.

## Escopo auditado

```text
START_CONTABILIDADE.bat
scripts/invoke-startup-runtime-preflight.ps1
scripts/start-contabilidade-resilient.ps1
scripts/start-contabilidade-core.bat
scripts/verify-runtime-images.ps1
scripts/start-compose-sequential.bat
scripts/start-compose-sequential.ps1
scripts/check-contabilidade.ps1
scripts/doctor-contabilidade.ps1
scripts/lib/startup-preflight.psm1
scripts/lib/contabilidade-docker.psm1
scripts/lib/startup-probe.psm1
scripts/lib/native-process.psm1
scripts/tests/**
.github/workflows/startup-actions.yml
```

## Evidência e limitações

- O output real do usuário comprovou que os 37 arquivos parseavam depois da PR `#142`; a falha era
  posterior, de escopo/import de módulo.
- O diff foi revisado para manter Compose, banco, volumes, imagens, migrations, dependências e produto
  inalterados.
- Nenhuma execução de GitHub Actions apareceu para o HEAD da PR durante esta integração. Portanto, o
  workflow novo não é apresentado como executado.
- A prova autoritativa final continua sendo Windows PowerShell 5.1 + Docker Desktop no SHA integrado.

## Prova final após merge

```powershell
git switch main
git pull --ff-only
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\tests\assert-startup-powershell-contract.ps1
.\START_CONTABILIDADE.bat doctor
.\START_CONTABILIDADE.bat dev
```

O preflight esperado deve mostrar, antes da verificação do daemon:

```text
[OK] Preflight PowerShell: <N> script(s) validado(s).
[OK] Contratos dos modulos de startup validados.
[STARTUP-PREFLIGHT] Validando Docker CLI, daemon, Compose e Buildx...
```

Se ocorrer outra falha, ela já estará além de parser/import/export e deverá ser classificada pelo
comando e etapa exatos, sem reconstruir o diagnóstico desde o início.
