# STR-SEC-002 — resultado

- **ITEM:** `STR-SEC-002`
- **WAVE:** `CONTABILIDADE_HARDENING_WAVE_006`
- **STATUS:** `PASS_ESTRUTURAL`
- **BASELINE recebido:** `latest main`; checkout inicial `0c4d42b78cd996ac22f1940fed4c21dcc5d4405b`
- **DISPATCH_KEY:** `3088e636102f43188815c68c1cb2f9ab059befe9cfd09dc84da5b49b6d901547`
- **Owners alterados:** novo workflow de supply chain, `scripts/security/supply-chain/**` e este resultado.
- **Migration:** nenhuma.

## Entrega

- workflow independente para SAST Java/TypeScript, filesystem, secrets, IaC, Dockerfiles e scan local
  das três imagens, sem publicação;
- ações GitHub referenciadas por SHA completo e scanners com versão fixa;
- política determinística de severidade, exceção obrigatoriamente atribuída/justificada/com validade,
  redaction e classificação explícita de feed ou imagem indisponível;
- inventário das imagens-base e provenance local ligando hash do artefato ao commit, com
  `published: false`;
- fixtures cobrem aceite/rejeição por severidade, exceção válida/vencida, redaction, feed
  indisponível, imagem ausente e pin de ações.

## Locks preservados

- `LOCK-DEP-001`: controles são compatíveis com execução on-premise e runners GitHub, sem mudar
  dependências do produto.
- `LOCK-DATA-001`: fixtures são sintéticas e o relatório normalizado remove descrição e valores de
  campos sensíveis.
- `LOCK-TEST-001`: indisponibilidade de feed/imagem resulta em `environment-limitation`, nunca em
  aprovação; nenhuma mudança de produção foi feita para satisfazer scanner.

## Validação executada

| Comando | Resultado |
|---|---|
| `python3 scripts/orchestration/dispatch_guard.py ... --github-aware --register` | `DISPATCH_ALLOWED`; auditoria remota indisponível sem variáveis GitHub |
| `python3 -m unittest discover -s scripts/security/supply-chain/tests -p 'test_*.py'` | PASS, 5 testes |
| `python3 -m py_compile scripts/security/supply-chain/*.py` | PASS |
| parser JSON em policy, exceções e fixtures | PASS |
| `ruby -e "require 'yaml'; ... YAML.safe_load_file ..."` | PASS para workflow e regras Semgrep |
| `git diff --check` | PASS |

## Limitações e provas pendentes

- Docker não está instalado neste executor. Os scans Semgrep/Trivy, builds e scans das imagens não
  foram alegados como executados localmente; sua execução permanece a cargo do workflow em runner
  com Docker e acesso aos feeds. Essa ausência é `ENVIRONMENT_LIMITATION`, não aprovação de
  vulnerabilidades.
- PyYAML não está instalado; a validação YAML foi concluída pelo parser Psych/Ruby disponível.
- Nenhum provider fiscal, registry autenticado, dado real ou operação paga foi acessado.

## Commit e PR

Commit e metadados da PR são criados no handoff desta task após a validação final.
