# FIX-STARTUP-PROBE-001 — lifecycle idempotente do startup probe

**Prioridade:** `P0_BLOCKER`  
**Estado:** `IN_PROGRESS_USER_AUTHORIZED`  
**Ambiente autoritativo:** Windows PowerShell 5.1 + Docker Desktop  
**Migration:** `NONE`

## Problema comprovado

Depois de construir e carregar corretamente as três imagens runtime, o fluxo entra no startup sequencial e tenta limpar `contabilidade-startup-probe`. Quando o container não existe, Docker retorna exit code não zero e escreve `No such container` em stderr.

O script atual usa `$ErrorActionPreference = 'Stop'` e executa Docker diretamente:

```powershell
& docker @Arguments *> $null
```

No Windows PowerShell 5.1, stderr nativo pode virar `NativeCommandError` antes de a função ler `$LASTEXITCODE`. Assim, `AllowFailure` não aplica a semântica pretendida.

## Causa raiz

`start-compose-sequential.ps1` contorna o executor já existente em `scripts/lib/contabilidade-docker.psm1`. O defeito combina:

- invocação nativa direta;
- `ErrorActionPreference=Stop`;
- redirecionamento de streams como substituto de classificação;
- ausência de categoria para container inexistente;
- cleanup executado no início, em `Start-Probe`, após readiness e no `finally`;
- inexistência de testes de lifecycle do probe.

## Escopo obrigatório

Analisar e, quando necessário, alterar:

- `scripts/start-compose-sequential.ps1`;
- `scripts/start-compose-sequential.bat`;
- `scripts/start-contabilidade-core.bat`;
- `scripts/start-contabilidade-resilient.ps1`;
- `scripts/lib/contabilidade-docker.psm1`;
- `scripts/lib/native-process.psm1`;
- `scripts/tests/**` relacionados ao startup;
- `scripts/codex/validate-docker-orchestration.mjs` e seus testes;
- logs por tentativa e mensagens finais.

Compose, banco, migrations, produto, providers e dados reais ficam fora do owner.

## Implementação exigida

### Centralização

- importar e usar o módulo Docker canônico no startup sequencial;
- remover ou substituir o `Invoke-Docker` local que usa `& docker` diretamente;
- encaminhar também `inspect`, `exec`, `compose ps`, `compose logs` e `compose up` pelo mesmo contrato;
- manter exit code como autoridade;
- nunca depender de `2>$null` ou `*>$null` para transformar falha em sucesso.

### Classificação

Reconhecer especificamente:

```text
CONTAINER_ABSENT_EXPECTED
CONTAINER_REMOVED
CONCURRENT_REMOVAL_EXPECTED
IMAGE_AVAILABLE
IMAGE_MISSING
DOCKER_DAEMON_UNAVAILABLE
DOCKER_PERMISSION_OR_API_FAILURE
PROBE_NAME_OWNERSHIP_CONFLICT
PROBE_CREATE_FAILED
PROBE_REMOVE_FAILED
```

`No such container` só é benigno em operação onde ausência é permitida. Daemon indisponível, permission denied, conflito de nome, timeout ou falha de API continuam vermelhos.

### Ownership do probe

- adicionar label estável, por exemplo `contabilidade.local.startup-probe=true`;
- container com mesmo nome e label diferente não pode ser removido;
- criação deve usar `--label` e o nome canônico;
- inspect deve validar status e label antes de declarar a sonda pronta.

### Cleanup race-safe

```text
exit 0 -> removido
No such container -> ausente esperado
inspect/rm race -> ausente esperado
outro erro -> falha real
```

Se a operação principal e o cleanup falharem, preservar a causa principal e anexar a falha de cleanup. Se a operação principal passar, falha real de cleanup deixa o startup vermelho.

### Imagens e transição de etapas

A verificação deve distinguir imagem válida, imagem ausente, daemon indisponível e falha real do container efêmero. A saída deve anunciar separadamente o fim da verificação das imagens e o início do startup sequencial.

### Logs

Registrar, sem segredo: operação lógica, categoria, exit code, tentativa, estado do probe e caminho do log.

## Testes obrigatórios no mesmo PR

### Pester

Cobrir no mínimo:

1. probe inexistente;
2. probe parado;
3. probe running;
4. probe removido concorrentemente;
5. imagem existente;
6. imagem ausente;
7. daemon indisponível;
8. falha real ao remover;
9. primeira execução;
10. execução repetida;
11. conflito de ownership por label;
12. falha real ao criar;
13. cleanup no `finally`;
14. preservação da exception principal.

### Processo nativo

Provar no Windows PowerShell 5.1 que stdout/stderr e exit code são capturados sem `NativeCommandError` prematuro.

### Docker real

Exercitar containers efêmeros identificados por label, inclusive remoção concorrente. Nenhum recurso fora do prefixo de teste pode ser removido.

### Compose real

Incluir o harness de `STR_STARTUP_TEST_001_INTEGRATED_COMPOSE_HARNESS.md`. Execução Cloud/Linux não substitui a prova Windows.

## Aceite

- nenhum `& docker` direto nos scripts operacionais de startup fora do módulo canônico;
- probe ausente não interrompe startup;
- falha real continua vermelha;
- primeiro e segundo startup passam em projeto efêmero;
- probe ausente ao final;
- logs preservam causa e exit code;
- Pester Windows e harness Docker/Compose passam;
- nenhuma alteração destrutiva em banco, volumes, documentos ou backups.

## Rejeição automática

A task será rejeitada se a solução for apenas:

```powershell
2>$null
*>$null
$ErrorActionPreference = 'SilentlyContinue'
try/catch que ignora toda exception
docker rm ... || true
```

ou se os testes cobrirem somente o caminho feliz.

`FIX_STARTUP_PROBE_001_P0_BLOCKER`
