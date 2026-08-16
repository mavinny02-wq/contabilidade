# Estado atual do Contabilidade

**Classificação:** `CANONICAL_ACTIVE_CHECKPOINT`
**Reconciliado em:** `2026-08-16`
**Branch de integração:** `main`
**HEAD verificado antes desta mudança de governança:** `7c6079caa54d1e7526a3e03c5ee41893581ff9b1`
**Versão declarada:** `0.5.1`
**Frontier Flyway observado:** `V12`
**PR aberta no checkpoint:** `#56`
**Modo:** `TRANSITION_TO_EVIDENCE_DRIVEN_ORCHESTRATION`

## Verdade de integração

- O HEAD verificado contém a integração da PR `#55`.
- A PR `#56` está aberta, mergeable e não integrada.
- Owners de startup/dev/on-premise, `.env.example`, `README.md`, `build.yml` e scripts relacionados
  permanecem reservados à PR `#56`.
- Esta fundação de governança usa owners separados e não assume o conteúdo da PR aberta.
- Nenhuma próxima onda funcional está liberada.

## Estado de validação

A prova Cloud v0.5.1 é evidência histórica de baseline anterior. Ela não torna a `main` atual verde.

O antigo `GATE-VAL-001` é mantido como compatibilidade, porém passa a ser classificado:

```text
LEGACY_AGGREGATE_GATE_PENDING_DECOMPOSITION
```

Ele não deve bloquear indiscriminadamente todo trabalho independente nem ser fechado por uma única
execução parcial. A decomposição por owner, ambiente e validade de evidência é item P0
`STR-TEST-001`.

Situação atual:

- backend aggregate current-release: `NOT_PROVEN`;
- frontend aggregate current-release: `NOT_PROVEN`;
- worker aggregate current-release: `NOT_PROVEN`;
- Flyway V1–V12 em PostgreSQL alvo: `LOCAL_RUNTIME_PROOF_PENDING`;
- dev Windows/Docker Desktop: `LOCAL_RUNTIME_PROOF_PENDING`;
- on-premise/Keycloak: `LOCAL_RUNTIME_PROOF_PENDING`;
- providers fiscais reais/pagos: `NOT_AUTHORIZED_NOT_REQUIRED_FOR_ORDINARY_VALIDATION`;
- coverage agregado atual: `NOT_MEASURED`.

## Ondas

- `PREPARED_NOT_RELEASED`: nenhuma;
- `RELEASED_FOR_EXECUTION`: nenhuma;
- owners executáveis em andamento visíveis no GitHub: PR `#56`;
- migration owner aberto: nenhum observado;
- próxima onda: `NOT_SELECTED`.

O backlog estrutural está registrado, mas registro não é liberação. Uma seleção posterior deve
resolver owners e baseline no momento da liberação.

## Locks ativos

- on-premise first;
- providers externos negados por padrão;
- chamadas pagas exigem autorização explícita;
- credenciais/dados reais proibidos em automação;
- sem bypass de CAPTCHA/MFA/anti-bot;
- prova Cloud não substitui prova Windows;
- até cinco owners totais por onda, sem filler;
- no máximo um owner de migration;
- evidência válida é reutilizada; rerun é focado;
- sem push direto na `main`.

Ver `docs/decisoes/CONTABILIDADE_LOCKS_OPERACIONAIS.md`.

## Owners reservados pela PR #56

Resumo de owner:

- startup oficial e documentação de inicialização;
- scripts de startup/maintenance/database state;
- `.env.example`;
- `.github/workflows/build.yml`;
- `README.md`;
- documentação de build/deploy resiliente.

A lista exata é mantida na matriz de ownership e deve ser revalidada pelo GitHub antes de nova
seleção.

## Próximas transições

1. integrar ou encerrar a PR `#56` e reconciliar seu resultado;
2. integrar esta fundação de governança;
3. executar `STR-TEST-001` para decompor o gate por owner/evidência;
4. executar `STR-ORQ-002` para registrar e proteger o frontier de migrations;
5. habilitar branch protection/required checks em `STR-ORQ-001`;
6. somente então liberar a primeira onda v2 com no máximo cinco owners e um migration owner.

`CONTABILIDADE_CURRENT_STATE_V2_FOUNDATION`
