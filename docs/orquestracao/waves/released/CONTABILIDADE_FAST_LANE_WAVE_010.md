# Contabilidade Fast Lane Wave 010

**Classificação:** `CANONICAL_RELEASED_WAVE`
**Status:** `RELEASED_FOR_EXECUTION`
**Contrato:** `2.0`
**Baseline comum:** `main@d14e8624cafb23462abc3cc693a798459fcd870e`
**Owners executáveis:** `5`
**Migration owner:** `NONE`
**Lane:** `FAST`

## Owners

| Slot | ITEM | Owner | Resultado |
|---:|---|---|---|
| 1 | `FIX-SEC-IAM-001` | `BACKEND_IAM_FAIL_CLOSED` | rejeitar papéis JWT desconhecidos |
| 2 | `FIX-STARTUP-PREFLIGHT-001` | `WINDOWS_STARTUP_PARSE_PREFLIGHT` | parser PowerShell antes do build |
| 3 | `VAL-TECH-CONSOLE-CURRENT-001` | `TECHNICAL_CONSOLE_CURRENT_CONTRACT_VALIDATION` | provar endpoints atuais |
| 4 | `STR-ARCH-BE-004` | `CERTIDAO_EMPRESA_QUERY_BOUNDARY` | findings arquiteturais 4 → 1 |
| 5 | `STR-INF-001` | `ENVIRONMENT_CONTRACT_GUARD` | guard dev/on-premise/CI |

## Dispatch keys

| ITEM | DISPATCH_KEY |
|---|---|
| `FIX-SEC-IAM-001` | `f3b77d50701cde679abacd85011e18c37e383b75b87f78c561c6c135d4c893ae` |
| `FIX-STARTUP-PREFLIGHT-001` | `de4b84436b331c1cbc4c6fd4c393f32c5987c99c442b029e6039538c0bc4a4d5` |
| `VAL-TECH-CONSOLE-CURRENT-001` | `79d1de1e00ff7224dbccba207995d97c25a4e1f3d1353a3c5daea4e647e8f45d` |
| `STR-ARCH-BE-004` | `35bd42558531a2c89ae3fe42e88ed85d5ed8f4ccc3de3d539b7cab3d0a896041` |
| `STR-INF-001` | `ba73043442bdbecdaca0166eeb5a93098905b0092342e94d32bbd82f9e308c25` |

## Independência

- segurança JWT, startup, testes da Console Técnica, boundary Certidão/Empresa e tooling de ambientes
  possuem árvores de escrita distintas;
- nenhum slot depende do resultado de outro slot;
- nenhum owner cria migration;
- configurações runtime são read-only em `STR-INF-001`;
- produto é read-only em `VAL-TECH-CONSOLE-CURRENT-001`;
- documentação canônica permanece com o orquestrador;
- providers reais, chamadas pagas, credenciais e dados reais permanecem proibidos.

## Estratégia de validação

O full-stack da Wave 009 não é repetido nesta onda: ele já ficou runtime-verde e o único drift foi
fechado por `STR-ARCH-BE-003`. Como Wave 010 contém duas correções de produto/infra, o smoke
consolidado do novo HEAD será selecionado somente após a integração dos cinco resultados.

## Gates externos

Windows dev e segundo startup, on-premise/Keycloak, Required CI remoto, branch protection,
restore rehearsal e providers reais continuam fora da wave.

## Launcher pack

`docs/orquestracao/waves/released/CONTABILIDADE_FAST_LANE_WAVE_010_LAUNCHERS.txt`

`CONTABILIDADE_FAST_LANE_WAVE_010_RELEASED`
