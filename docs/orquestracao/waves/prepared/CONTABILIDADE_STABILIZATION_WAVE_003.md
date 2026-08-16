# Contabilidade Stabilization Wave 003

**Classificação:** `CANONICAL_PREPARED_WAVE`  
**Status:** `PREPARED_NOT_RELEASED`  
**Inspecionada contra:** `main@91a42c8e96775f2cbe3c09481beed879d4fbab31`  
**Objetivo:** integrar o caminho oficial de startup, completar a prova Windows e fechar controles
estruturais necessários antes de declarar o runtime on-premise estabilizado.

## Evidência consumida

- `VAL-STAB-FULLSTACK-001`: `REUSE_PASS`;
- `BUG-INFRA-001`: `PASS`;
- `VAL-STAB-BACKEND-PG-002`: `REUSE_PASS`;
- `VAL-STAB-FRONTEND-NODE24-002`: `REUSE_PASS`;
- `VAL-STAB-WORKER-NODE24-PW-002`: `REUSE_PASS`;
- `STR-ORQ-002`: `DONE`;
- `STR-RUN-001`: `PARTIAL_CONTRACT_GAP`.

Não repetir a campanha full-stack Cloud. Nenhuma mudança funcional posterior observada invalida
backend, frontend, worker ou Flyway.

## Gates de liberação

1. PR `#57` integrada na `main`;
2. PR `#56` classificada como `SUPERSEDED` antes de liberar seu successor;
3. refresh de HEAD, PR queue e owner matrix;
4. shards desta wave presentes na `main`;
5. nenhum owner concorrente nos paths abaixo;
6. validação do pack com máximo de cinco tasks e migration owner zero.

Se qualquer gate falhar, a wave permanece preparada e não publica launchers.

## Owners preparados

| Slot | ITEM | Tipo | Owner exclusivo | Resultado esperado |
|---:|---|---|---|---|
| 1 | `FIX-STARTUP-MAIN-001` | correction | startup/Compose/build workflow | sucessor limpo da PR `#56` na latest main |
| 2 | `BUG-RUN-001` | correction | coletor/schema/testes Windows | evidência real de runtime, health, Flyway e segundo startup |
| 3 | `STR-ORQ-003` | implementation | manifests/validator de waves | lifecycle prepared/released/consumed/superseded determinístico |
| 4 | `STR-REL-001` | implementation | versão/release guard | drift VERSION/Maven/npm/imagens/docs falha CI |
| 5 | `STR-OWN-001` | implementation | CODEOWNERS/hotspots | owners reais e paths críticos explicitados |

## Ownership e paralelismo

### Slot 1 — `STARTUP_DEPLOY`

Owner dos arquivos da PR `#56`, incluindo `.github/workflows/build.yml`. Deve preservar o guard
Docker corrigido e o migration-governance job atuais.

### Slot 2 — `WINDOWS_EVIDENCE`

Owner somente de `scripts/orchestration/windows-evidence-*`, wrapper, schema e testes associados.
Não altera startup/Compose.

### Slot 3 — `WAVE_MANIFESTS`

Owner de:

```text
docs/orquestracao/waves/**
scripts/orchestration/*wave*manifest*
.github/workflows/wave-manifest-governance.yml
```

Não altera current state/ledger durante execução; reconciliação é do orquestrador.

### Slot 4 — `VERSION_RELEASE`

Owner de:

```text
scripts/orchestration/*version*
.github/workflows/version-governance.yml
docs/implementacao/STR_REL_001_RESULT.md
```

Pode ler `VERSION`, POMs, packages, manifests e docs, mas não realizar bump nesta task.

### Slot 5 — `CODEOWNERS_HOTSPOTS`

Owner de:

```text
.github/CODEOWNERS
docs/implementacao/STR_OWN_001_RESULT.md
```

A matriz canônica é atualizada serialmente pelo orquestrador após o resultado. Não inventar usuário
ou time; usar somente identidades GitHub confirmadas.

## Regras comuns

- baseline idêntico em todos os slots no momento da release;
- sem dependência same-wave;
- migration owner: `NONE`;
- providers externos/pagos: `FORBIDDEN`;
- credenciais e dados reais: `FORBIDDEN`;
- testes proporcionais ao owner;
- documentação/resultados por path exato;
- nenhum slot altera o RESULT_MD de outro.

## Ordem de integração sugerida

Os slots são executáveis em paralelo. Para integração:

1. `STR-ORQ-003`;
2. `STR-REL-001`;
3. `STR-OWN-001`;
4. `BUG-RUN-001`;
5. `FIX-STARTUP-MAIN-001`.

A ordem é de reconciliação, não dependência de execução.

## Resultado após consumo

A próxima ação não será outra wave Cloud ampla. Será a campanha manual Windows dev:

1. primeiro startup;
2. coleta runtime;
3. health/Flyway/serviços;
4. segundo startup/reuso;
5. correções focadas, se houver;
6. on-premise + Keycloak somente após dev verde.

`CONTABILIDADE_STABILIZATION_WAVE_003_PREPARED`
