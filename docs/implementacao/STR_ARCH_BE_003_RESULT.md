# STR-ARCH-BE-003 — resultado

- **ITEM:** `STR-ARCH-BE-003`
- **WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_009`
- **CONTRACT:** `2.0`
- **DISPATCH_KEY:** `151f6711bceb996527e847ad830a2169a710657cd195e08d3e140ca266c4ce55`
- **BASELINE liberado:** `357dd4b8827c0c9620d0dd7e8398bc3468418ff9`
- **HEAD inicial do checkout:** `cd11fb439420708756d9de9c1e62483a839cbd8d` (merge documental que
  liberou a Wave 009 sobre o baseline)
- **STATUS:** `PASS_STRUCTURAL`
- **MIGRATION:** nenhuma

## Entrega

- `common/search` passou a depender de uma porta e projeção de consulta próprias, sem importar
  classes internas da feature Empresa.
- O adapter da feature Empresa delega à consulta preexistente com página zero e limite recebido,
  preservando normalização, filtro e ordenação autoritativos do `EmpresaService`.
- Endpoint, autorização, limite de dez resultados, ordem e payload visível foram preservados.
- Testes focados cobrem o mapeamento do controller, o termo mínimo, a delegação e a projeção do
  adapter.
- O inventário permanece com 600 arestas e passa de seis para quatro findings. Somente os dois
  fingerprints da busca global foram removidos do allowlist; os outros quatro permanecem
  inalterados.

## Owners alterados

- `backend/src/main/java/br/com/contabilidade/common/search/**`;
- adapter/projeção de busca em `backend/src/main/java/br/com/contabilidade/empresa/service/**`;
- testes focados correspondentes;
- `scripts/architecture/baseline.json` e `scripts/architecture/allowlist.json`;
- este `RESULT_MD`.

Nenhum endpoint, permissão, migration, POM, lockfile ou regra fiscal foi alterado.

## Locks preservados

- `LOCK-EVID-001`: o inventário determinístico foi gerado e reutilizado como baseline; o rerun
  final foi focado no guard e nos testes do boundary.
- `LOCK-TEST-001`: o preflight inicialmente executado contra o HEAD documental foi classificado
  como `BASELINE_DRIFT`; ele foi repetido contra o baseline de execução registrado pela Wave e
  retornou `DISPATCH_ALLOWED`. Nenhuma produção foi alterada para mascarar falha.

## Validação

| Comando | Resultado |
|---|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_FAST_LANE_WAVE_009 --item STR-ARCH-BE-003 --baseline 357dd4b8827c0c9620d0dd7e8398bc3468418ff9 --key 151f6711bceb996527e847ad830a2169a710657cd195e08d3e140ca266c4ce55 --github-aware --register` | `DISPATCH_ALLOWED`; auditoria remota indisponível sem configuração GitHub. |
| `java -version` | PASS — OpenJDK `21.0.2`. |
| `cd backend && mvn -B -Dtest=BuscaGlobalControllerTest,EmpresaBuscaGlobalAdapterTest test` | PASS — 3 testes. |
| `cd backend && mvn -B -DskipTests test-compile` | PASS. |
| `python3 -m unittest scripts.architecture.tests.test_architecture_guard` | PASS — 4 testes. |
| `python3 scripts/architecture/architecture_guard.py inventory --output /tmp/architecture-final.json` | PASS — 600 arestas e 4 findings. |
| `python3 scripts/architecture/architecture_guard.py check` | PASS — 600 arestas e 4 findings permitidos. |
| `git diff --check` | PASS. |

## Limitações e provas pendentes

- A auditoria remota do preflight não ocorreu porque o checkout não possui remote/credenciais
  GitHub; a chave e o baseline liberados foram validados localmente.
- Compile, testes unitários focados e guard arquitetural não provam runtime com PostgreSQL,
  navegador, provider externo ou ambiente Windows; essas provas não pertencem a este owner.

## Commit e PR

- Commit: criado na branch atual após as validações.
- PR: não criada: a ferramenta obrigatória `make_pr` não está disponível neste ambiente e o checkout não possui remote Git configurado.
