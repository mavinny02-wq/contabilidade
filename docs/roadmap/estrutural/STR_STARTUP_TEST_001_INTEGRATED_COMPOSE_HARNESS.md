# STR-STARTUP-TEST-001 — harness integrado de startup Compose

**Prioridade:** `P0_BLOCKER`  
**Estado:** `INCLUDED_IN_FIX_STARTUP_PROBE_001_OWNER`
**Wave:** `CONTABILIDADE_STARTUP_RECOVERY_WAVE_013`
**Executor autoritativo:** Windows PowerShell 5.1 + Docker Desktop  
**Migration:** `NONE`

## Objetivo

Criar uma suíte integrada que detecte regressões do fluxo oficial antes de o usuário repetir builds longos. A suíte deve exercitar lifecycle Docker, startup sequencial e execução repetida usando recursos totalmente efêmeros e identificáveis.

## Princípios

- nenhum provider externo;
- nenhum segredo ou dado real;
- nenhuma alteração do contexto Docker ativo;
- nenhuma seleção de builder global;
- nenhum prune global;
- nenhum `docker compose down -v` fora do projeto efêmero do teste;
- nenhuma remoção por nome sem validar label/project ownership;
- resultado pinado ao Git SHA;
- falha ambiental classificada, nunca apresentada como `PASS`.

## Estrutura esperada

```text
scripts/tests/startup-probe.Tests.ps1
scripts/tests/startup-native-process.Tests.ps1
scripts/tests/startup-docker-integration.ps1
scripts/tests/startup-compose-integration.ps1
scripts/tests/fixtures/startup/**
scripts/tests/run-startup-reliability-gate.ps1
```

Os nomes podem variar, mas as responsabilidades não podem ser omitidas.

## Modo unitário

Mocks do executor Docker devem retornar objetos completos com stdout, stderr e exit code. Não é suficiente mockar somente `$LASTEXITCODE`.

O teste deve demonstrar que a decisão é tomada pelo resultado estruturado, inclusive com `$ErrorActionPreference='Stop'` no chamador.

## Modo Docker lifecycle real

Usar um identificador aleatório:

```text
contabilidade-startup-it-<run-id>
```

Todo container deve receber labels:

```text
contabilidade.test-suite=startup-reliability
contabilidade.test-run=<run-id>
```

Cenários:

1. remover nome inexistente;
2. remover container stopped;
3. remover container running;
4. duas remoções concorrentes;
5. detectar container com nome igual e label alheio;
6. criar e inspecionar probe;
7. verificar imagem existente;
8. verificar imagem inexistente;
9. simular comando Docker inválido sem classificar como ausência;
10. garantir zero recursos da suíte ao final.

## Modo Compose end-to-end

### Isolamento

- `COMPOSE_PROJECT_NAME=contabilidade-startup-it-<run-id>`;
- `.env` sintético em diretório temporário;
- portas livres escolhidas pelo harness;
- volume PostgreSQL exclusivo do project name;
- diretórios de documentos/backups temporários;
- imagens runtime pinadas já existentes;
- providers configurados para loopback fechado e bloqueio de rede externa.

O harness deve falhar se o project name não possuir o prefixo de teste antes de qualquer cleanup com volume.

### Primeira execução

- probe ausente inicialmente;
- startup sequencial termina com exit code 0;
- PostgreSQL healthy;
- backend liveness/readiness HTTP 200;
- worker `/health` HTTP 200;
- frontend `/healthz` HTTP 200;
- proxy `/api/info` HTTP 200;
- Flyway última versão `12` e success `true`;
- Keycloak e postgres-bootstrap ausentes no modo dev;
- inserir marker sintético no banco;
- capturar ID do container PostgreSQL;
- `contabilidade-startup-probe` ausente ao final.

### Segunda execução

- executar novamente sem limpar volume;
- startup termina com exit code 0;
- ID do PostgreSQL permanece igual, salvo justificativa explícita e preservação comprovada do volume;
- marker sintético permanece;
- todos os health checks voltam a 200;
- nenhum probe órfão;
- nenhum serviço extra no modo dev;
- nenhuma chamada externa.

### Falha controlada

Usar override de teste para tornar um serviço não ready sem alterar o produto. Confirmar:

- exit code não zero;
- logs do serviço afetado coletados;
- classificação correta;
- causa original não apagada por cleanup;
- probe removido;
- volume do PostgreSQL preservado;
- nenhuma limpeza global.

## Modo oficial da máquina do usuário

Além do projeto efêmero, o gate final deve executar o comando oficial no checkout limpo:

```powershell
.\START_CONTABILIDADE.bat dev
```

Depois repetir o mesmo comando. Essa etapa comprova a integração dos wrappers BAT/PowerShell, logs por tentativa e caminhos reais com espaços.

## Saídas

Gerar:

```text
startup-reliability-evidence.json
startup-reliability-evidence.md
```

Campos mínimos:

- `gitSha`;
- `runId`;
- `mode`;
- versões PowerShell/Docker/Compose;
- contexto Docker lido e preservado;
- cenários executados;
- exit codes;
- categorias;
- IDs antes/depois;
- health checks;
- Flyway frontier;
- marker persistence;
- probe final state;
- recursos removidos;
- limitações.

## CI

- parser, guards e Pester mockado podem rodar em runners sem Docker;
- integração real requer runner Windows self-hosted explicitamente rotulado para Docker Desktop, ou execução manual controlada;
- ausência desse runner é `ENVIRONMENT_LIMITATION`, não `PASS`;
- o workflow não deve ficar required até uma run real ser observada e estabilizada.

## Aceite

A suíte é aceita quando falha de forma determinística em implementações vulneráveis e passa com a correção, incluindo duas execuções consecutivas no mesmo host.

`STR_STARTUP_TEST_001_INTEGRATED_COMPOSE_HARNESS_REQUIRED`
