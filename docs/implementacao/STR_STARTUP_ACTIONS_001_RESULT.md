# STR-STARTUP-ACTIONS-001 — resultado

## Identificação

- **Baseline:** `ff599c8f6d0657d6545ff7712ca70e891d80e394`
- **Status:** `IMPLEMENTED_STRUCTURAL_WINDOWS_RUNTIME_PENDING`
- **Migration:** nenhuma
- **Produto/Compose:** comportamento funcional preservado; novos entrypoints somente

## Problema

O comando `START_CONTABILIDADE.bat dev` acumulava compilação Java, instalação/typecheck/build npm,
criação de imagens e startup Compose. Assim, erro de compilador era apresentado ao operador como
falha ao "subir" o sistema, e não existia um caminho puro para iniciar imagens já verificadas.

## Implementação

Foram separados cinco contratos:

| Ação | Compila | Constrói imagem | Inicia Compose | Muta Docker no diagnóstico |
|---|---:|---:|---:|---:|
| `doctor` | não | não | não | não |
| `check` | sim | não | não | não |
| `build` | sim | sim | não | apenas artefatos/imagens |
| `start` | não | não | sim | lifecycle esperado do startup |
| `dev` | sim | sim | sim | compatibilidade histórica |

O core respeita `CONTABILIDADE_BUILD_ONLY=1` e encerra antes de chamar
`start-compose-sequential.bat`. O caminho `start` chama diretamente o preflight e o startup
sequencial, que verifica as imagens existentes antes de alterar serviços.

## Diagnóstico

`doctor-contabilidade.ps1` verifica de forma read-only:

- parser PowerShell;
- JDK/Java 21 e Maven usando Java 21;
- Node 22.12+ e npm;
- Docker CLI, daemon, Compose, Buildx e contexto ativo;
- Compose efetivo;
- override artifact-only;
- três imagens runtime da versão declarada.

`check-contabilidade.ps1` executa somente compile/typecheck/build e grava logs por etapa, sem chamar
Docker ou Compose.

## Safeguards

- `validate-startup-actions.mjs` impede recompilação no `start`;
- impede Docker no `check`;
- impede mutações no `doctor`;
- exige que build-only termine antes do Compose;
- regressões sintéticas exercitam caminhos válidos e violações;
- workflow `startup-actions.yml` usa Windows e parser PowerShell 5.1.

## Evidência e limitação

Os contratos e testes foram adicionados, mas esta sessão não possui o Windows/Docker Desktop do
usuário e não alega runtime verde. A prova final permanece:

```text
START_CONTABILIDADE.bat doctor
START_CONTABILIDADE.bat check
START_CONTABILIDADE.bat build
START_CONTABILIDADE.bat start
START_CONTABILIDADE.bat start
```

As duas últimas execuções devem preservar PostgreSQL/volume e terminar com backend, worker e
frontend saudáveis e probe ausente.

## Causa de uma eventual falha de compilação

Depois desta separação, uma falha em `check` ou `build` é classificada como defeito de
produto/toolchain. O arquivo/linha exatos somente podem ser identificados pelo log Maven/TypeScript
da execução atual; não são inferidos a partir do erro histórico de Docker.

`STR_STARTUP_ACTIONS_001_IMPLEMENTED_RUNTIME_PENDING`
