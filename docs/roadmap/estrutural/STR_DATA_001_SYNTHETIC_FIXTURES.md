# STR-DATA-001 — fixtures sintéticas governadas

**Classificação:** `EXTRA_OWNER`  
**Objetivo:** padronizar fixtures determinísticas e impedir que dados reais entrem em testes,
logs, exemplos ou resultados.

## Dispatch obrigatório

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_QUALITY_GATE_WAVE_005 \
  --item STR-DATA-001 \
  --baseline c3c06e8cb5921f96ecdb9b1e397594d01dd4430f \
  --key 835bed59be0169475abb1edc00b554f04d773f255d478b691d7bd1903f25a6af \
  --github-aware --register
```

Resultado e PR devem expor a mesma `DISPATCH_KEY`.

## Owner

Pode alterar somente:

- novo `scripts/testing/**`;
- catálogo/política de fixtures sintéticas;
- gerador determinístico e seeds;
- fixtures sintéticas canônicas próprias;
- testes focados;
- `docs/implementacao/STR_DATA_001_RESULT.md`.

Testes existentes dos componentes, scanner `scripts/security/**`, código funcional, manifests,
lockfiles, migrations, checkpoint e manifests da wave são read-only.

## Contrato das fixtures

Cada fixture canônica deve declarar metadados machine-readable:

- `synthetic: true`;
- identificador e versão do schema;
- propósito;
- owner;
- gerador e seed;
- data fixa ou relógio controlado quando necessário;
- classificação de sensibilidade;
- checksum SHA-256 do conteúdo normalizado.

## Regras de dados

- usar somente nomes explicitamente fictícios;
- usar domínios reservados como `.invalid`, `example.com` e `example.org`;
- CNPJ/CPF, quando o algoritmo exigir formato válido, devem ser gerados e marcados como sintéticos,
  nunca copiados de pessoas ou empresas;
- documentos e PDFs devem conter banner textual de ficção;
- datas, IDs e UUIDs devem ser determinísticos por seed;
- nenhum segredo, token, certificado, cookie, payload fiscal ou path pessoal;
- nenhum sample extraído de produção, suporte, print, e-mail ou log real;
- fixtures inválidas usadas para teste negativo devem ser declaradas como tal.

## Guard

Criar validação local que:

- inventarie apenas catálogo e paths autorizados;
- confira metadados, checksum, seed e determinismo;
- detecte e rejeite indícios de dado real sem imprimir o valor;
- use fingerprints/redaction compatíveis com o lock de dados;
- falhe em fixture não catalogada ou catálogo apontando arquivo ausente;
- não duplique nem enfraqueça o secret/PII guard existente.

## Testes

Cobrir:

- geração repetida byte a byte idêntica;
- catálogo válido;
- checksum alterado;
- fixture não catalogada;
- domínio/e-mail realista proibido;
- CPF/CNPJ não marcado como sintético;
- segredo/PII redigido;
- seed ou metadata ausente.

## Aceite

- catálogo e gerador reproduzíveis;
- zero dado real;
- nenhuma chamada externa;
- sem alteração de testes/produto nesta task;
- resultado informa quantidade de fixtures, schemas e checksums, nunca valores sensíveis.
