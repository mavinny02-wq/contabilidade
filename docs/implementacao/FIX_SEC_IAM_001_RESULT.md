# FIX-SEC-IAM-001 — resultado

- **ITEM:** `FIX-SEC-IAM-001`
- **CONTRACT:** `2.0`
- **WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_010`
- **DISPATCH_KEY:** `f3b77d50701cde679abacd85011e18c37e383b75b87f78c561c6c135d4c893ae`
- **Baseline verificado:** `507a09610700a16415860f5d966e3a9cda17b377`
- **Status:** `PASS`
- **Migration:** `NONE`

## Owners alterados

- `JwtAuthoritiesConverter`: aliases conhecidos são normalizados para `Papeis`; entradas
  desconhecidas, vazias, nulas, não string e claims malformadas não criam authorities; a coleção
  resultante elimina duplicatas de realm/client.
- testes focados de segurança para papéis conhecidos, desconhecidos, malformados e duplicados;
- inventário/guard IAM para reconhecer o mapeamento tipado e provar a política `reject`.

Nenhum realm, migration, endpoint, POM ou configuração de autenticação foi alterado.

## Locks preservados

- `LOCK-DATA-001`: somente tokens e claims sintéticos, sem credenciais ou dados reais.
- `LOCK-EVID-001`: validações focadas no owner e inventário determinístico regenerado.
- `LOCK-TEST-001`: o finding reproduzido era `PRODUCT_REGRESSION`; a produção aceitava authority
  desconhecida e foi corrigida de forma bounded antes da nova prova.

## Comandos e resultados

- `java -version`: `PASS`, OpenJDK `21.0.2`.
- `python3 scripts/security/iam/iam_guard.py --generate`: `PASS`, inventário regenerado.
- `python3 scripts/security/iam/iam_guard.py`: `PASS`, sem findings e sem
  `UNKNOWN_AUTHORITY_ACCEPTED`.
- `python3 -m unittest scripts.security.iam.tests.test_iam_guard`: `PASS`, 10 testes.
- `cd backend && mvn -B -Dtest=JwtAuthoritiesConverterTest test`: `PASS`, 4 testes, zero falhas.
- `cd backend && mvn -B -DskipTests test-compile`: `PASS`.
- `git diff --check`: `PASS`.

## Limitações e provas pendentes

- Nenhuma chamada a Keycloak real foi feita ou é necessária para esta validação estrutural.
- Não há prova de runtime externo, banco ou navegador; esses ambientes estão fora do owner.
- Commit e PR são registrados no handoff Git/GitHub desta execução.
