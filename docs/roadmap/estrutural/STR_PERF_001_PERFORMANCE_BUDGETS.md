# STR-PERF-001 — budgets reproduzíveis de artefatos

**Classificação:** `EXTRA_OWNER`  
**Objetivo:** medir artefatos de backend, frontend e worker e criar limites de crescimento baseados
em repetibilidade, sem otimizar código nesta task.

## Dispatch obrigatório

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_QUALITY_GATE_WAVE_005 \
  --item STR-PERF-001 \
  --baseline c3c06e8cb5921f96ecdb9b1e397594d01dd4430f \
  --key e7203ebb99c0a8858c4c7c2ee8071c11f7e58356d874c45876e6a81251e7d9a1 \
  --github-aware --register
```

Resultado e PR devem expor a mesma `DISPATCH_KEY`.

## Owner

Pode alterar somente:

- novo `scripts/performance/**`;
- baseline/policy machine-readable de budgets;
- fixtures e testes do guard;
- workflow dedicado, caso necessário e com nome próprio;
- ignore específico para artefatos temporários, se indispensável;
- `docs/implementacao/STR_PERF_001_RESULT.md`.

Código funcional, POM, package manifests/lockfiles, Dockerfiles, required gate, checkpoint e manifests
da wave são read-only.

## Medições

### Backend

- tamanho do JAR executável;
- quantidade e tamanho dos maiores entries relevantes;
- hash do artefato e toolchain;
- não usar tempo de download ou cache como budget de produto.

### Frontend

- tamanho total de `dist`;
- maior chunk JavaScript bruto e gzip;
- CSS bruto/gzip;
- quantidade de chunks/assets;
- registrar explicitamente o warning histórico do chunk principal acima de 500 kB como baseline,
  não como aprovação eterna.

### Worker

- tamanho total de `dist`;
- maior arquivo emitido;
- quantidade de arquivos;
- tamanho do código próprio separado de `node_modules`.

## Reprodutibilidade

- executar cada build/medição duas vezes em árvore limpa;
- normalizar somente timestamps/metadados voláteis comprovados;
- registrar diferenças observadas;
- tolerância deve derivar da repetibilidade ou de margem pequena documentada, não de número aleatório;
- baseline associa componente, versão, comando, Node/JDK/npm/Maven e SHA.

## Budgets e ratchet

O guard deve:

- falhar quando crescimento exceder budget/tolerância;
- não falhar por redução;
- detectar artefato ausente ou medição vazia;
- separar mudanças de quantidade e tamanho;
- permitir exceção com owner, motivo e expiração;
- produzir relatório sem caminhos pessoais;
- não declarar performance runtime, latência ou throughput a partir de tamanho de artefato.

## Testes

Fixtures devem cobrir:

- baseline válido;
- crescimento dentro da tolerância;
- crescimento bloqueado;
- redução permitida;
- arquivo ausente;
- componente novo sem baseline;
- exceção válida e expirada;
- duas medições não reproduzíveis.

## Aceite

- três componentes medidos;
- baseline real e budgets versionados;
- builds e guard reproduzíveis;
- nenhum código de produto otimizado nesta task;
- criar successor `STR-FE-BUNDLE-001` se o frontend exigir redução, sem executar a redução aqui.
