# BUG-CI-ARCHITECTURE-GUARD-CROSS-PLATFORM-ORDER-001 result

## Status

`IMPLEMENTADO_ESTRUTURALMENTE_VALIDADO; INTEGRACAO_PENDENTE`

## Baseline

`86a48739be87dc1ef118acb01cd515b3ed574048`

## Classificação

`CROSS_PLATFORM_TEST_INFRASTRUCTURE_REGRESSION`

O architecture guard comparava listas de caminhos ordenadas pela semântica nativa de `Path`.
Linux ordenava nomes com distinção de maiúsculas, enquanto Windows aplicava a semântica de
`WindowsPath`. O mesmo conjunto de 601 arestas e zero findings era serializado em ordens diferentes,
fazendo o required gate falhar no Windows sem mudança arquitetural real.

Além disso, `Path.write_text` traduzia `LF` para `CRLF` no Windows, impedindo que inventários
semanticamente iguais tivessem bytes e hash reproduzíveis entre plataformas.

## Correção

- caminhos e arestas agora usam chave POSIX explícita, sensível a maiúsculas e independente do host;
- travessia de ciclos usa a mesma ordem canônica;
- o arquivo de inventário é escrito como UTF-8 binário com `LF` canônico;
- regressões diretas cobrem a ordem de `PureWindowsPath` e os line endings do inventário;
- o baseline não foi regenerado: o inventário atual voltou a coincidir exatamente com a autoridade
  já versionada.

## Owners alterados

- `scripts/architecture/architecture_guard.py`;
- `scripts/architecture/tests/test_architecture_guard.py`;
- `docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md`;
- este RESULT_MD.

## Validação

- `python -m unittest scripts.architecture.tests.test_architecture_guard -v`: PASS, 6 testes;
- `python scripts/architecture/architecture_guard.py check`: PASS, 601 arestas e zero findings;
- duas gerações descartáveis do inventário: PASS, SHA-256
  `2DEA56FFAE94B652344613528DAE670606720D111E8512C73DE63AC69C9FAD65` em ambas;
- baseline versionado versus inventário Windows: PASS, mesmo SHA-256;
- orchestration governance guard: PASS, zero erros/warnings;
- context governance guard: PASS, zero erros/warnings;
- secret/PII guard: PASS, zero findings;
- `python -m py_compile` e `git diff --check`: PASS.

## Limites

- nenhuma regra arquitetural, allowlist, source de produto ou baseline foi alterado;
- nenhuma chamada LLM, Docker, serviço, push ou deploy;
- isto prova determinismo do guard e a estrutura atual, não runtime da aplicação.
