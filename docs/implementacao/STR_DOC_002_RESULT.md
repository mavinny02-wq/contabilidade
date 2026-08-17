# STR-DOC-002 — resultado

## Identificação

- **ITEM:** `STR-DOC-002`
- **WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_009`
- **CONTRACT:** `2.0`
- **BASELINE:** `cd11fb439420708756d9de9c1e62483a839cbd8d`
- **STATUS:** `PASS`

## Owners alterados

- `backend/src/main/java/br/com/contabilidade/common/document/ArmazenamentoLocalDocumento.java`;
- `backend/src/test/java/br/com/contabilidade/common/document/ArmazenamentoLocalDocumentoTest.java`;
- este `RESULT_MD`.

POM e migrations permaneceram somente leitura. Não houve dependência nova nem mudança de schema.

## Implementação e evidência

O storage local agora valida referências relativas normalizadas, rejeita referências codificadas e
componentes symlink, aceita somente arquivos regulares, grava em temporário no diretório de destino,
promove por move atômico com fallback apenas quando o filesystem não oferece atomic move, remove o
temporário após falha, limita a leitura e mantém exclusão ausente idempotente. A descrição pública do
`Resource` e as mensagens de negócio não incluem o path físico.

A suíte focada usa somente diretórios temporários e bytes sintéticos. Ela cobre traversal, caminho
absoluto, encoding, symlink em escrita/leitura/exclusão, referência normalizada, promoção completa,
falha de stream e cleanup, preservação do arquivo anterior, leitura bounded, ausência, exclusão
idempotente e duas escritas concorrentes sem conteúdo parcial.

## Locks preservados

- `LOCK-DOC-001`: conteúdo continua atrás da abstração de storage; o owner não altera autorização;
- `LOCK-DATA-001`: testes usam bytes sintéticos, sem credencial, PII ou documento real;
- `LOCK-EVID-001`: rerun limitado à suíte focada liberada pelo launcher;
- `LOCK-TEST-001`: a fragilidade reproduzida foi classificada como `PRODUCT_REGRESSION` e corrigida
  de forma bounded.

## Comandos e resultados

1. `cd backend && mvn -B -DskipTests test-compile` — `PASS`, Java 21, build success.
2. `cd backend && mvn -B -Dtest=ArmazenamentoLocalDocumentoTest test` — `PASS`, 6 testes, zero
   falhas/erros/skips.
3. `cd backend && mvn -B -Dtest=ArmazenamentoLocalDocumentoTest test` — segundo `PASS`, 6 testes,
   zero falhas/erros/skips.
4. `git diff --check` — `PASS`.

## Limitações e provas pendentes

- A prova é de runtime Linux no filesystem temporário do executor; não constitui prova de junction
  Windows nem de filesystems que não suportam promoção atômica.
- O fallback para move não atômico foi compilado, mas não foi exercitado porque o filesystem do
  ambiente suporta `ATOMIC_MOVE`.
- Listagem pertence ao reconciliador existente e não faz parte da interface
  `ArmazenamentoDocumento`; nenhuma API de listagem foi acrescentada neste owner bounded.
- Nenhuma prova de banco, browser, provider fiscal ou runtime Windows foi executada ou alegada.

## Commit e PR

- **COMMIT:** commit da task `STR-DOC-002` neste branch.
- **PR:** `NOT_CREATED_ENVIRONMENT_LIMITATION`; a ferramenta obrigatória `make_pr` não está
  disponível no ambiente e o GitHub CLI não possui autenticação configurada.
