# STR-SEC-IAM-001 — Resultado

## Identificação

- **ITEM:** `STR-SEC-IAM-001`
- **WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_009`
- **CONTRACT:** `2.0`
- **BASELINE assinada da onda:** `357dd4b8827c0c9620d0dd7e8398bc3468418ff9`
- **HEAD inicial (latest main disponível):** `cd11fb439420708756d9de9c1e62483a839cbd8d`
- **DISPATCH_KEY:** `b532d464f635ea91c985dff051bb16250a49c2f2dd05d026cf4160bc82f9fee3`
- **STATUS:** `PASS_WITH_PRODUCT_DRIFT`

## Entrega

- Inventário IAM determinístico cobre os quatro papéis backend, 17 permissões, usos de permissão
  em controllers, quatro rotas públicas, dois realms, aliases JWT e fronteira do worker.
- Policy local explicita o mapeamento realm/backend, os únicos caminhos de claims aceitos, a
  allowlist pública mínima, o contrato dev sem autenticação e a ausência de autoridades de usuário
  no token do worker.
- Guard estático falha de forma fechada para papel/permissão duplicado ou ausente, permissão órfã,
  divergência de realm, rota pública inesperada, ausência do fallback autenticado, drift de claims,
  autoridade desconhecida, fronteira do worker e contrato dev.
- Fixtures e testes são integralmente sintéticos e verificam determinismo e redação dos findings.

## Finding de produto

O guard detectou que `JwtAuthoritiesConverter` transforma qualquer papel desconhecido em uma
autoridade `ROLE_*`. A falha foi classificada como `PRODUCT_REGRESSION`: ela contraria o requisito
de rejeitar claims inesperados como privilégio. O código de produto é read-only neste owner e não
foi alterado; a correção deve ser tratada por successor próprio.

## Owners alterados

- `scripts/security/iam/**`
- `docs/implementacao/STR_SEC_IAM_001_RESULT.md`

Backend, frontend, worker, realms, migrations, dependências e lockfiles permaneceram read-only.

## Locks preservados

- `LOCK-DATA-001`: fixtures não contêm credencial, token, claim bruto, PII ou dado real.
- `LOCK-EVID-001`: inventário foi gerado duas vezes e comparado byte a byte; os testes focados são
  reutilizáveis localmente e não dependem de Keycloak.
- `LOCK-TEST-001`: o finding do converter foi classificado antes de qualquer correção; nenhuma
  mudança fora do owner foi feita para mascará-lo.

## Validação

| Comando | Resultado |
|---|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_FAST_LANE_WAVE_009 --item STR-SEC-IAM-001 --baseline 357dd4b8827c0c9620d0dd7e8398bc3468418ff9 --key b532d464f635ea91c985dff051bb16250a49c2f2dd05d026cf4160bc82f9fee3 --github-aware --register` | `DISPATCH_ALLOWED`; auditoria GitHub indisponível sem variáveis do ambiente |
| `python3 scripts/security/iam/iam_guard.py --generate` (duas execuções) | Inventários byte a byte idênticos; ambas sinalizaram corretamente `UNKNOWN_AUTHORITY_ACCEPTED` e encerraram com código 1 |
| `cmp /tmp/iam-first.json scripts/security/iam/inventory.json` | PASS |
| `python3 -m unittest discover -s scripts/security/iam/tests -v` | PASS, 10 testes de papel, permissão, rota pública/protegida, realm, JWT, worker, determinismo e redação |
| `git diff --check` | PASS |

## Limitações e provas pendentes

- A validação é estática e local: não comprova runtime, Keycloak real, PostgreSQL, browser,
  ambiente Windows ou provider.
- A baseline assinada da onda antecede o merge documental que liberou a própria onda; o HEAD
  inicial já continha esse merge e nenhum código de produto posterior à baseline foi alterado.
- Permanece pendente um successor autorizado para tornar a conversão JWT fail-closed e então
  promover a execução do guard para `PASS` sem finding.

## Commit e PR

- Commit: produzido na branch da task após as validações.
- PR: não criado neste ambiente: a ferramenta obrigatória `make_pr` não está disponível e o
  checkout não possui remote Git configurado.
