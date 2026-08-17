# Contabilidade Fast Lane Wave 009 — consumida

**Status:** `CONSUMED`
**Baseline liberada:** `main@357dd4b8827c0c9620d0dd7e8398bc3468418ff9`
**Baseline final reconciliada:** `main@d14e8624cafb23462abc3cc693a798459fcd870e`
**PRs principais:** `#110–#114`
**Correções de startup posteriores absorvidas:** `#115–#119`
**Migration owner:** `NONE`

## Resultado

| ITEM | Resultado | Disposição |
|---|---|---|
| `VAL-W008-FULLSTACK-009` | runtime completo verde; arquitetura inicialmente divergente | `PASS_RUNTIME_RECONCILED` |
| `STR-QA-FE-002` | Node 24, 24 testes, coverage reproduzível e a11y 6/6 | `PASS_COMPLETE` |
| `STR-SEC-IAM-001` | guard IAM determinístico; aceitação de papel desconhecido detectada | `FIX_PRODUCT` |
| `STR-ARCH-BE-003` | busca global desacoplada; 600 arestas e findings 6 → 4 | `PASS_STRUCTURAL` |
| `STR-DOC-002` | storage local endurecido; suíte adversarial verde duas vezes | `PASS` |

## Reconciliação do smoke

O smoke `VAL-W008-FULLSTACK-009` comprovou PostgreSQL, Flyway V1–V12, JPA validate,
liveness/readiness, worker, frontend, proxy, heartbeat, 19 jornadas, seis cenários de acessibilidade,
zero chamadas externas e zero HTTP 5xx. O único gate vermelho era o baseline arquitetural.

A própria `STR-ARCH-BE-003`, integrada na mesma onda, regenerou de forma revisada a autoridade do
grafo e concluiu `architecture_guard.py check` com 600 arestas e quatro findings permitidos. Portanto
o runtime é reutilizável e não será repetido apenas para mudar a classificação documental.

## Successors

- `FIX-SEC-IAM-001`: tornar a conversão JWT fail-closed para papéis desconhecidos.
- `FIX-STARTUP-PREFLIGHT-001`: validar todos os scripts PowerShell antes de Maven/npm/build.
- `VAL-TECH-CONSOLE-CURRENT-001`: validar o contrato atual da Console Técnica, sem endpoints obsoletos.
- `STR-ARCH-BE-004`: retirar três dependências Certidão → persistência interna de Empresa.
- `STR-INF-001`: criar guard determinístico das fronteiras dev/on-premise/CI.

A onda não deve ser relançada.

`CONTABILIDADE_FAST_LANE_WAVE_009_CONSUMED`
