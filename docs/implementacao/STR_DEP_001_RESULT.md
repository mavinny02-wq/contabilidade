# STR-DEP-001 — SBOM, licenças e vulnerabilidades

**ITEM:** `STR-DEP-001`
**Baseline:** `6f9f7a600a3f16db91f07be7b3cfa983c53c7f92`
**Status:** `IMPLEMENTADO_AGUARDANDO_INTEGRACAO`

## Resultado

Foi criado um inventário read-only e reproduzível para o backend Maven, o frontend npm e o
automation worker npm. O launcher fixa CycloneDX Maven Plugin `2.9.1` e CycloneDX npm `4.0.3`,
normaliza somente metadados voláteis e produz três SBOMs CycloneDX JSON e um índice com SHA-256.
Os resultados permanecem artefatos ignorados pelo Git, sem alteração de manifest, lockfile ou
versão do produto.

O guard local usa apenas a biblioteca padrão Python. Ele valida o formato estrutural das SBOMs,
aplica listas de licenças permitidas/proibidas/em revisão e exige exceções fechadas com componente,
versão, motivo, owner, severidade e expiração. O importador do relatório Trivy converte advisories
para o contrato determinístico; achados `HIGH`/`CRITICAL` sem exceção válida falham.

O workflow dedicado separa o job determinístico do scan advisory dependente de rede. Falha de
download/feed encerra o job advisory e não pode produzir `PASS`; operacionalmente deve ser
classificada como `ENVIRONMENT_LIMITATION`. Actions usam SHAs completos e as ferramentas usam
versões fixas. Nenhum token, configuração autenticada ou payload de registry é coletado.

## Owners alterados e locks preservados

- owner alterado: `scripts/dependencies/**`, workflow dedicado, ignore do artefato e este resultado;
- `LOCK-DEP-001`: geração funciona em Linux/on-premise e CI, sem mudar dependências do produto;
- `LOCK-EVID-001`: SBOMs normalizadas possuem hashes reproduzíveis e são publicadas como artefato;
- `LOCK-TEST-001`: política determinística e scan de rede são distintos, sem tratar indisponibilidade
  externa como aprovação.

## Validações

- `bash scripts/dependencies/generate-sboms.sh`: `PASS`; backend `104`, frontend `226` e worker `49`
  componentes, todos em CycloneDX `1.6`;
- segunda geração seguida de `cmp /tmp/index1.json dependency-artifacts/index.json`: `PASS`, índice
  e hashes idênticos;
- `python -m unittest scripts/dependencies/tests/test_dependency_guard.py`: `PASS` (`7` cenários),
  incluindo licença permitida, GPL-3.0, variante GPL-3.0, desconhecida, exceções válida/expirada e
  advisory alto com/sem exceção;
- leitura JSON e assertions de `bomFormat`, `specVersion` e componentes nas três SBOMs: `PASS`;
- `git diff --check`: `PASS`.

## Limitações e provas pendentes

Não existe remoto Git configurado no checkout, portanto a atualidade do baseline em relação ao
GitHub não pôde ser atualizada (`ENVIRONMENT_LIMITATION`). O scan Trivy não foi executado localmente:
ele depende do feed/rede e permanece como prova do job CI, sem alegação de ausência de advisories.

## Commit/PR

Commit e PR são criados no encerramento desta execução.
