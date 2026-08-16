# STR-QA-001 — baseline e ratchet de coverage

**Objetivo:** medir coverage real por componente e criar um ratchet reproduzível, sem declarar
percentual agregado falso ou escolher threshold arbitrário.

## Dispatch obrigatório

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_QUALITY_GATE_WAVE_005 \
  --item STR-QA-001 \
  --baseline c3c06e8cb5921f96ecdb9b1e397594d01dd4430f \
  --key 88f897e1dc468bd04488dba240ba6b6d67c6c535f01843f2f074a3a341180226 \
  --github-aware --register
```

Resultado e PR devem expor a mesma `DISPATCH_KEY`.

## Owner

Único owner nesta wave para:

- `backend/pom.xml`;
- `frontend/package.json` e lockfile;
- `automation-worker/package.json` e lockfile;
- configs de coverage;
- novo `scripts/quality/**`;
- baseline/policy de coverage;
- `docs/implementacao/STR_QA_001_RESULT.md`.

Não criar ou alterar workflow nesta task. Código funcional, migrations, checkpoint e manifests da
wave são read-only.

## Medição por componente

### Backend

- usar JaCoCo com versão gerenciada/justificada;
- medir line e branch coverage da suíte disponível;
- separar claramente teste executado de teste bloqueado por Docker;
- não excluir packages de negócio, segurança ou persistência apenas para elevar o número.

### Frontend

- usar provider de coverage compatível com Vitest;
- medir lines, branches, functions e statements;
- registrar arquivos sem teste, não apenas os importados pela suíte;
- preservar locale/typecheck/build.

### Worker

- usar coverage do Node 24 ou ferramenta test-only justificável;
- incluir `worker.test` e `reliability.test`;
- registrar a suíte como parcial caso Chromium não esteja provisionado;
- não transformar 10/11 testes em coverage completo.

## Baseline e ratchet

Gerar contrato machine-readable com:

- componente;
- métricas e denominadores;
- comandos;
- toolchain;
- completude `COMPLETE` ou `PARTIAL`;
- motivos de limitação;
- SHA do baseline;
- tolerância técnica baseada em duas medições idênticas/reproduzíveis.

Regras:

- nenhum threshold inventado como 80%;
- primeira execução estabelece baseline, não dívida escondida;
- ratchet falha em queda acima da tolerância por componente/métrica;
- aumento do denominador sem cobertura também é visível;
- exceção exige owner, motivo, escopo e expiração;
- não calcular média agregada entre Java, frontend e worker.

## Testes

Fixtures devem provar:

- baseline válido;
- queda bloqueada;
- aumento permitido;
- tolerância mínima aplicada;
- componente parcial não apresentado como completo;
- exceção expirada bloqueada;
- relatório ausente ou vazio bloqueado.

## Aceite

- medições reais persistidas sem artefatos volumosos versionados;
- comandos reproduzíveis;
- manifests/lockfiles atualizados por gerenciador, nunca manualmente;
- licenças de novas dependências registradas;
- `RESULT_MD` apresenta números reais, denominadores e limitações;
- nenhuma alteração de regra de negócio.
