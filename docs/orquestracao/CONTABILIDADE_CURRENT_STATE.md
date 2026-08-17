# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`
**Reconciliado em:** `2026-08-17`
**Branch de integração:** `main`
**HEAD funcional reconciliado:** `d14e8624cafb23462abc3cc693a798459fcd870e`
**Versão declarada:** `0.5.1`
**Frontier Flyway:** `V12`
**Modo:** `FAST_LANE_WAVE_010_RELEASED`

## Verdade de integração

- A Fast Lane Wave 009 foi integrada pelas PRs `#110–#114`.
- As correções Windows/startup `#115–#119` foram absorvidas na baseline atual.
- A PR `#120` registrou uma task obsoleta da Console Técnica como `BASELINE_DRIFT`; ela não alterou
  produto e não cria autoridade para endpoints inexistentes.
- **PR aberta na reconciliação:** nenhuma.
- Nenhum owner de migration está aberto ou liberado.
- A `main` permanece sem branch protection/ruleset obrigatório.
- Nenhuma execução de GitHub Actions foi observada no HEAD; `Required CI` continua
  `GITHUB_ACTIONS_SETTINGS_OR_PERMISSION_BLOCKER`, não `PASS`.

## Resultado da Fast Lane Wave 009

| ITEM | Resultado | Disposição |
|---|---|---|
| `VAL-W008-FULLSTACK-009` | runtime verde; baseline arquitetural inicialmente divergente | `PASS_RUNTIME_RECONCILED` |
| `STR-QA-FE-002` | coverage frontend completo/reproduzível e a11y 6/6 | `PASS_COMPLETE` |
| `STR-SEC-IAM-001` | guard IAM verde como mecanismo; papel desconhecido aceito pelo produto | `FIX_PRODUCT` |
| `STR-ARCH-BE-003` | busca global isolada; 600 arestas e findings 6 → 4 | `PASS_STRUCTURAL` |
| `STR-DOC-002` | storage local adversarialmente endurecido | `PASS` |

O smoke comprovou PostgreSQL, Flyway V1–V12, JPA validate, health, heartbeat, proxy, 19 jornadas,
acessibilidade, zero chamadas externas e zero HTTP 5xx. O único gate vermelho foi fechado na própria
onda por `STR-ARCH-BE-003`; repetir o full-stack agora seria rerun sem mudança de evidência.

## Estado Windows

```text
RUNTIME_IMAGES_BUILD: PASS_USER_EVIDENCE
DOCKER_ACTIVE_CONTEXT_PRESERVED: FIX_INTEGRATED
DOCKER_DNS_BOUNDARY_PRIMA: FIX_INTEGRATED
POWERSHELL_VARIABLE_COLON: FIX_INTEGRATED
WINDOWS_DEV_STACK_AFTER_FIX: NOT_YET_PROVEN
WINDOWS_SECOND_START_REUSE: NOT_PROVEN
ONPREMISE_KEYCLOAK_LOGIN: BLOCKED_UNTIL_DEV_GREEN
```

A execução do usuário chegou à criação e verificação das três imagens. O parser do startup sequencial
falhou depois disso e foi corrigido. A prova final da stack após o fix continua humana e fora dos
slots Codex.

## Fast Lane Wave 010

1. `FIX-SEC-IAM-001` — conversão JWT fail-closed;
2. `FIX-STARTUP-PREFLIGHT-001` — parser PowerShell antes do build;
3. `VAL-TECH-CONSOLE-CURRENT-001` — contrato atual da Console Técnica;
4. `STR-ARCH-BE-004` — boundary Certidão/Empresa, findings 4 → 1;
5. `STR-INF-001` — guard dos ambientes dev/on-premise/CI.

Os cinco owners partem de `main@d14e8624cafb23462abc3cc693a798459fcd870e`, não possuem dependência
same-wave, não criam migration e não utilizam provider, credencial ou dado real.

## Campanhas fora dos slots

- `VAL-QA-BE-DOCKER-001`: duas execuções da suíte crítica com Java 21 + Docker;
- Windows dev + segundo startup: humano;
- on-premise + Keycloak: após Windows dev verde;
- GitHub Actions/branch protection: configuração externa;
- restore, promoção e rollback: campanha runtime;
- providers reais/pagos: não autorizados.

## Ondas

- Waves 002–009: `CONSUMED`;
- `CONTABILIDADE_FAST_LANE_WAVE_010`: `RELEASED_FOR_EXECUTION`;
- owners executáveis: `5`;
- migration owner: `NONE`.

## Próxima transição

Integrar e reconciliar os cinco resultados. Depois, selecionar um único smoke consolidado do novo
HEAD e as correções estritamente comprovadas. Não repetir provas já válidas e não usar filler.

`CONTABILIDADE_CURRENT_STATE_FAST_LANE_WAVE_010_RELEASED`
