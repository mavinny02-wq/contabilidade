# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`
**Reconciliado em:** `2026-08-17`
**Branch de integração:** `main`
**HEAD reconciliado:** `a34afbe0c7a7876ea231c3a9a1c913dbe39928ae`
**Versão declarada:** `0.5.1`
**Frontier Flyway:** `V12`
**Modo:** `STARTUP_RECOVERY_WAVE_013_RELEASED`

## Decisão de emergência

A execução normal da Fast Lane Wave 012 está suspensa. Nenhum owner restante da onda está autorizado
enquanto o ambiente oficial de desenvolvimento não completar, em Windows + Docker Desktop, o primeiro
startup e o startup repetido sem falha.

A Wave 012 foi superseded pelo gate `CONTABILIDADE_STARTUP_RELIABILITY_GATE_P0_001`. Os itens
`STR-INF-002`, `STR-INF-003`, `STR-CI-003` e `STR-OBS-003` retornam ao backlog. O resultado já integrado
`VAL-W011-FULLSTACK-012` permanece como evidência Cloud/Linux, mas não substitui a prova local.

**PR aberta na reconciliação:** nenhuma. A branch
`codex/fix-startup-issue-in-main-workflow` já havia sido integrada pela PR `#71`; seu tip não contém
a correção P0 nova e não reserva mais o owner.

## Evidência atual do usuário

```text
BACKEND_LOCAL_BUILD: PASS_USER_EVIDENCE
FRONTEND_LOCAL_BUILD: PASS_USER_EVIDENCE
AUTOMATION_WORKER_LOCAL_BUILD: PASS_USER_EVIDENCE
CONTABILIDADE_BACKEND_IMAGE_0_5_1: PASS_USER_EVIDENCE
CONTABILIDADE_FRONTEND_IMAGE_0_5_1: PASS_USER_EVIDENCE
CONTABILIDADE_WORKER_IMAGE_0_5_1: PASS_USER_EVIDENCE
WINDOWS_COMPOSE_SERVICES_STARTED: FAIL
WINDOWS_DEV_STACK_READY: NOT_PROVEN
WINDOWS_SECOND_START_REUSE: NOT_PROVEN
ONPREMISE_KEYCLOAK_LOGIN: BLOCKED_UNTIL_DEV_GREEN
```

O marcador `[6/6] Verifying runtime images...` pertence ao script core. A falha relatada ocorre logo
na transferência para `scripts/start-compose-sequential.ps1`, antes de qualquer serviço ser iniciado,
na limpeza inicial do container temporário `contabilidade-startup-probe`.

## Defeito P0 reproduzido

O script sequencial usa `$ErrorActionPreference = 'Stop'` e possui uma invocação nativa direta:

```powershell
& docker @Arguments *> $null
```

`Remove-Probe` chama `docker rm -f contabilidade-startup-probe` com intenção de permitir ausência.
Porém, no Windows PowerShell 5.1, o stderr `No such container` pode virar `NativeCommandError` antes de
a função consultar `$LASTEXITCODE`. Portanto, `-AllowFailure` não torna a operação idempotente.

O repositório já possui `Invoke-ContabilidadeNativeCommand` e `Invoke-ContabilidadeDocker`, que
capturam stdout/stderr separadamente e usam o exit code como autoridade. O script sequencial ainda
contorna esse contrato. Isso é um defeito estrutural, não apenas uma mensagem a silenciar.

## Trabalho emergencial em andamento

- **Item:** `FIX-STARTUP-PROBE-001`.
- **Wave:** `CONTABILIDADE_STARTUP_RECOVERY_WAVE_013`.
- **Estado:** `RELEASED_FOR_EXECUTION` com um único owner serial.
- **Owner:** startup sequencial, executor Docker, probe lifecycle, harness integrado e resultado.
- **Proibição:** não resolver somente com `2>$null`, `*>$null`, mudança global de
  `$ErrorActionPreference` ou swallow genérico de exit code.

O harness `STR-STARTUP-TEST-001` é inseparável do mesmo owner; não é um segundo slot e não executa
em paralelo com a correção. A campanha `VAL-WINDOWS-COMPOSE-STARTUP-001` continua bloqueada até o
fix ser integrado.

Nesta sessão de orquestração, Windows PowerShell `5.1.26100.9168` está disponível, mas o executável
`docker` não está instalado ou acessível no `PATH`. Isso limita a prova local desta sessão e adiciona
`DOCKER_CLI_UNAVAILABLE` ao preflight; não substitui nem contradiz a evidência do host do usuário.

A correção somente poderá ser classificada como concluída quando atender ao
`docs/orquestracao/STARTUP_RELIABILITY_GATE.md`.

## Gate obrigatório

O P0 exige, nesta ordem:

1. todos os comandos Docker do startup passando pelo executor nativo central;
2. classificação explícita de `CONTAINER_ABSENT`, CLI ausente, daemon indisponível e falha real;
3. testes Pester dos dez estados de probe/imagem/daemon descritos no shard;
4. teste Windows PowerShell 5.1 que prove que stderr nativo não aborta antes da classificação;
5. integração real com Docker para probe ausente, parado, running e removido concorrentemente;
6. primeiro startup `dev` verde;
7. segundo startup verde, com PostgreSQL reutilizado e dados sintéticos preservados;
8. probe ausente ao final de sucesso e falha;
9. evidência JSON/Markdown redigida, pinada ao SHA executado.

Static checks Linux, mocks ou build das imagens, isoladamente, não fecham esse gate.

## Ondas

- Waves 002–011: `CONSUMED`;
- Wave 012: `SUPERSEDED_BY_P0_STARTUP_HOLD`;
- Wave 013: `CONTABILIDADE_STARTUP_RECOVERY_WAVE_013`, um owner serial, sem feature;
- migration owner: `NONE`;
- próxima seleção funcional/estrutural normal: proibida até
  `WINDOWS_COMPOSE_STARTUP_GATE = PASS`.

## Campanhas externas preservadas

- backend/Testcontainers: aguardando executor Docker;
- on-premise + Keycloak: após dev e segundo startup verdes;
- Required CI remoto e branch protection: configuração externa;
- restore e promoção reais: aguardando runtime;
- providers fiscais reais/pagos: não autorizados.

## Próxima transição

1. executar e integrar o único owner da Wave 013 após revisão dos testes;
2. liberar uma campanha de validação Windows/Compose pinada ao novo SHA;
3. executar primeiro e segundo startup;
4. reconciliar a evidência;
5. somente então recalcular a próxima wave.

`CONTABILIDADE_CURRENT_STATE_STARTUP_RECOVERY_WAVE_013_RELEASED`
