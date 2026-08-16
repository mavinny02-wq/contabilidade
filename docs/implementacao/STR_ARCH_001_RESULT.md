# STR-ARCH-001 — resultado

**ITEM:** `STR-ARCH-001`  
**STATUS:** `PASS_STRUCTURAL`  
**WAVE_ID:** `CONTABILIDADE_HARDENING_WAVE_006`  
**DISPATCH_KEY:** `2a7a896f3fa04ee0feb9d60a91967b578bba52c516450af017cbd0bcc6e1a185`  
**BASELINE:** `0c4d42b78cd996ac22f1940fed4c21dcc5d4405b` (`latest main` disponível no checkout)  
**COMMIT/PR:** commit de implementação `c31060d`; PR `NOT_CREATED_TOOL_UNAVAILABLE`.

## Owners alterados

- `scripts/architecture/**`: extrator determinístico, políticas, allowlist, baseline e testes focados;
- `.github/workflows/architecture-boundaries.yml`: workflow dedicado;
- `docs/implementacao/STR_ARCH_001_RESULT.md`: este resultado.

Nenhum código de produto, manifesto, lockfile, migration ou workflow preexistente foi alterado.

## Resultado

- O guard inventaria imports Java e TypeScript locais, produz arestas ordenadas e identifica ciclos
  por componente fortemente conexo.
- As boundaries cobrem `common` e features/layers Java, `api`/`pages`/`app` no frontend e core versus
  providers concretos no worker. Imports relativos e o alias frontend `@/` são resolvidos antes da
  aplicação das regras.
- O baseline versionado contém 591 arestas. As dez violações preexistentes foram registradas com
  fingerprint, motivo, owner e revisão em `2027-02-16`; qualquer finding novo ou item vencido falha.
- Findings exibem somente regra e caminhos de origem/destino, sem conteúdo dos arquivos.

## Locks preservados

- `LOCK-EVID-001`: a evidência existente foi inventariada uma vez; validações subsequentes foram
  focadas no guard e em seus fixtures.
- `LOCK-TEST-001`: a ausência inicial do módulo PyYAML foi classificada como
  `ENVIRONMENT_LIMITATION`; nenhuma produção foi alterada e o YAML foi validado com Ruby/Psych.
- `LOCK-WAVE-001`: somente o owner liberado por `STR-ARCH-001` foi executado; nenhum filler foi
  criado.

## Comandos e evidências

| Comando | Resultado |
|---|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_HARDENING_WAVE_006 --item STR-ARCH-001 --baseline a3344a15a0581fd7f76f78766c6432b46f9a361e --key 2a7a896f3fa04ee0feb9d60a91967b578bba52c516450af017cbd0bcc6e1a185 --github-aware --register` | `DISPATCH_ALLOWED`; auditoria remota indisponível por ausência de `GITHUB_REPOSITORY`/`GITHUB_TOKEN`. |
| `python3 -m unittest scripts.architecture.tests.test_architecture_guard` | PASS, 4 testes. |
| `python3 scripts/architecture/architecture_guard.py check` | PASS, 591 arestas e 10 findings permitidos. |
| `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/architecture-boundaries.yml'); puts 'YAML valid'"` | PASS. |
| `python3 -m py_compile scripts/architecture/architecture_guard.py scripts/architecture/tests/test_architecture_guard.py` | PASS. |
| `git diff --check` | PASS. |

## Limitações e provas pendentes

- O preflight não conseguiu auditar duplicatas no GitHub por falta das variáveis de autenticação do
  ambiente, mas o registro local retornou `DISPATCH_ALLOWED`.
- A chamada obrigatória a `make_pr` foi tentada após o commit, mas a ferramenta não está disponível
  neste ambiente (`tools.make_pr is not a function`); portanto não foi possível criar a PR.
- Não há prova de runtime de produto, banco, navegador, provider ou Windows; elas não pertencem ao
  aceite estrutural deste owner.
