# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`
**Reconciliado em:** `2026-08-17`
**Branch de integração:** `main`
**HEAD funcional reconciliado:** `3ca4bcfd60d8ddaa515bf526196833dccacf5e35`
**Versão declarada:** `0.5.1`
**Frontier Flyway:** `V12`
**Modo:** `FAST_LANE_WAVE_011_RELEASED`

## Verdade de integração

- A Fast Lane Wave 010 foi integrada pelas PRs `#122–#126`.
- **PR aberta na reconciliação:** nenhuma.
- Nenhum owner de migration está aberto ou liberado.
- A `main` permanece sem branch protection/ruleset obrigatório.
- Nenhuma execução de GitHub Actions foi observada no HEAD; `Required CI` continua
  `GITHUB_ACTIONS_SETTINGS_OR_PERMISSION_BLOCKER`, não `PASS`.

## Resultado da Fast Lane Wave 010

| ITEM | Resultado | Disposição |
|---|---|---|
| `FIX-SEC-IAM-001` | unknown roles rejeitadas; guard IAM e testes verdes | `PASS` |
| `FIX-STARTUP-PREFLIGHT-001` | parser real antes de build; PowerShell 5.1 pendente | `PASS_STRUCTURAL_WINDOWS_RUNTIME_PENDING` |
| `VAL-TECH-CONSOLE-CURRENT-001` | contratos atuais verdes exceto negação 500 em vez de 403 | `FIX_PRODUCT` |
| `STR-ARCH-BE-004` | Certidão isolada de Empresa; findings 4 → 1 | `PASS_STRUCTURAL` |
| `STR-INF-001` | contratos dev/on-premise/CI determinísticos | `PASS_STRUCTURAL` |

O finding de autorização possui stack trace e teste reproduzível: `AccessDeniedException` de method
security cai no handler genérico e vira `ERRO_INTERNO`/500. Nenhum outro defeito de produto foi
comprovado na onda.

## Estado Windows

```text
RUNTIME_IMAGES_BUILD: PASS_USER_EVIDENCE
DOCKER_ACTIVE_CONTEXT_PRESERVED: FIX_INTEGRATED
DOCKER_DNS_BOUNDARY_PRIMA: FIX_INTEGRATED
POWERSHELL_VARIABLE_COLON: FIX_INTEGRATED
POWERSHELL_PARSE_FIRST: PASS_STRUCTURAL_WINDOWS_RUNTIME_PENDING
WINDOWS_DEV_STACK_AFTER_FIX: NOT_YET_PROVEN
WINDOWS_SECOND_START_REUSE: NOT_PROVEN
ONPREMISE_KEYCLOAK_LOGIN: BLOCKED_UNTIL_DEV_GREEN
```

A campanha humana deve atualizar a `main`, executar o startup dev, repetir o startup e coletar a
evidência v2. Ela não consome slot Codex.

## Fast Lane Wave 011

1. `FIX-TECH-AUTH-001` — negação de autorização mapeada para 403 seguro;
2. `STR-ARCH-BE-005` — remover o último finding Documento → Empresa;
3. `STR-SEC-003` — lifecycle de segredos sem armazenar valores;
4. `STR-REL-003` — manifesto imutável de promoção/rollback;
5. `STR-OPS-002` — harness offline de recovery rehearsal.

Os cinco owners partem de `main@3ca4bcfd60d8ddaa515bf526196833dccacf5e35`, não possuem dependência
same-wave, não criam migration e não utilizam provider, credencial, backup ou dado real.

## Campanhas fora dos slots

- `VAL-QA-BE-DOCKER-001`: duas execuções em Java 21 + Docker;
- PostgreSQL HTTP da Console Técnica: executor com Docker/Testcontainers;
- Windows dev + segundo startup: humano;
- on-premise + Keycloak: após Windows dev verde;
- GitHub Actions/branch protection: configuração externa;
- `STR-OPS-001`: restore real;
- `STR-REL-002`: promoção/rollback real;
- providers reais/pagos: não autorizados.

## Ondas

- Waves 002–010: `CONSUMED`;
- `CONTABILIDADE_FAST_LANE_WAVE_011`: `RELEASED_FOR_EXECUTION`;
- owners executáveis: `5`;
- migration owner: `NONE`.

## Próxima transição

Integrar e reconciliar os cinco resultados. Depois, executar um smoke consolidado somente se os
deltas de produto da Wave 011 exigirem invalidação da evidência full-stack; provas externas
continuam em campanhas próprias.

`CONTABILIDADE_CURRENT_STATE_FAST_LANE_WAVE_011_RELEASED`
