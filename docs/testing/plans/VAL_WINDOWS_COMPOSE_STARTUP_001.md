# VAL-WINDOWS-COMPOSE-STARTUP-001 — prova final do startup oficial

**Estado:** `WAITING_FOR_FIX_INTEGRATION`  
**Ambiente:** Windows PowerShell 5.1 + Docker Desktop  
**Authority:** execução real do comando oficial  
**Dados:** somente sintéticos

## Pré-condições

- `FIX-STARTUP-PROBE-001` integrado na `main`;
- Pester e integração Docker do PR verdes;
- checkout limpo;
- Docker Desktop iniciado;
- contexto Docker escolhido pelo usuário preservado;
- imagens runtime presentes ou construídas pelo fluxo oficial;
- providers e credenciais reais ausentes.

## Preparação

```powershell
git switch main
git pull --ff-only
git status --short
git rev-parse HEAD
docker context show
docker ps --filter "name=contabilidade-startup-probe" --format "{{.ID}} {{.Names}} {{.Status}}"
```

O status Git deve estar limpo. Probe ausente é esperado.

## Prova A — Pester no host autoritativo

```powershell
Invoke-Pester .\scripts\tests\contabilidade-docker.Tests.ps1
Invoke-Pester .\scripts\tests\native-process.Tests.ps1
Invoke-Pester .\scripts\tests\startup-preflight.Tests.ps1
Invoke-Pester .\scripts\tests\startup-probe.Tests.ps1
```

Executar também o runner integrado entregue por `STR-STARTUP-TEST-001`. Zero falhas são permitidas; cenários de probe e processo nativo não podem ser skipped no Windows.

## Prova B — lifecycle Docker real

Executar o harness efêmero e confirmar:

- ausência inicial aceita;
- stopped e running removidos;
- corrida de remoção aceita;
- label conflict rejeitado;
- erro real rejeitado;
- zero container de teste residual.

## Prova C — primeiro startup oficial

```powershell
.\START_CONTABILIDADE.bat dev
```

Aceite:

```text
exit code = 0
PostgreSQL healthy
backend readiness = 200
worker health = 200
frontend healthz = 200
proxy api/info = 200
Flyway = 12:true
Keycloak = absent
postgres-bootstrap = absent
startup probe = absent
```

Capturar:

```powershell
$postgresAntes = docker compose ps -q postgres
```

Inserir ou confirmar marker sintético pelo harness autorizado.

## Prova D — execução repetida

```powershell
.\START_CONTABILIDADE.bat dev
$postgresDepois = docker compose ps -q postgres
$postgresAntes -eq $postgresDepois
```

Aceite:

- segundo exit code 0;
- PostgreSQL reutilizado ou volume comprovadamente preservado;
- marker sintético permanece;
- backend, worker e frontend saudáveis;
- probe ausente;
- nenhum Keycloak/bootstrap;
- nenhum volume removido;
- nenhum `compose down -v`, prune global ou limpeza de documentos/backups.

## Prova E — falha controlada

Usar somente override efêmero do harness. Confirmar:

- falha real retorna código não zero;
- causa original aparece no log;
- cleanup não a substitui;
- probe é removido;
- banco e volume de teste permanecem até cleanup explícito;
- cleanup final remove apenas o project name efêmero.

## Evidência

Executar o coletor Windows v2 e anexar JSON/Markdown redigidos. Não anexar `.env`, tokens, passwords, certificates, documentos ou payloads.

## Disposição

```text
PASS -> libera recalcular a próxima wave
FAIL_PRODUCT_OR_SCRIPT -> successor bounded
ENVIRONMENT_LIMITATION -> repetir somente a prova afetada após corrigir ambiente
```

Sem `PASS`, o startup continua `NOT_PROVEN`.

`VAL_WINDOWS_COMPOSE_STARTUP_001_WAITING_FOR_FIX`
