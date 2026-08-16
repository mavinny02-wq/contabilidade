# STR-API-001 — OpenAPI e compatibility guard

**Objetivo:** produzir contrato OpenAPI determinístico e impedir breaking changes silenciosas entre
backend e frontend.

## Dispatch obrigatório

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_QUALITY_GATE_WAVE_005 \
  --item STR-API-001 \
  --baseline c3c06e8cb5921f96ecdb9b1e397594d01dd4430f \
  --key fbc08b313e084b952fdd0a3501df93a76e536bc56d687aa63cef7402b7c1b996 \
  --github-aware --register
```

Resultado e PR devem expor a mesma `DISPATCH_KEY`.

## Owner

Pode alterar somente:

- `contracts/openapi/**`;
- novo `scripts/contracts/**`;
- harness backend estritamente necessário à geração do contrato;
- mapa declarativo das operações consumidas pelo frontend;
- fixtures e testes do compatibility guard;
- workflow dedicado, se necessário e com nome próprio;
- `docs/implementacao/STR_API_001_RESULT.md`.

POM, package manifests/lockfiles, código funcional de controllers/services, migrations, required gate,
checkpoint e manifests da wave são read-only.

## Snapshot canônico

- gerar OpenAPI a partir da aplicação/backend atual, sem provider fiscal e sem dado real;
- normalizar ordem, servidores, timestamps e metadados voláteis;
- duas gerações consecutivas devem produzir bytes e SHA-256 idênticos;
- snapshot versionado precisa conter somente contrato público autorizado;
- endpoints internos sensíveis devem ser explicitamente classificados, não removidos por acaso.

## Breaking changes bloqueados

O guard deve detectar ao menos:

- remoção de path ou método;
- remoção ou mudança de `operationId`;
- parâmetro novo obrigatório ou mudança incompatível de tipo/formato;
- request body que se torna obrigatório ou incompatível;
- remoção de status/response usado;
- remoção de propriedade ou mudança incompatível de schema;
- enum narrowing;
- relaxamento de autorização sem decisão explícita;
- operação declarada pelo frontend ausente no snapshot.

Mudanças aditivas compatíveis devem passar. Exceção de breaking change exige owner, motivo, versão de
transição e expiração; o guard não decide sozinho versionamento de produto.

## Mapa frontend

Criar mapa estável de `operationId` ou path/método consumido pelos clients atuais. Não gerar client
novo nem refatorar chamadas nesta task. O teste deve falhar quando uma operação usada desaparece.

## Fixtures/testes

Cobrir:

- snapshot idêntico;
- mudança aditiva permitida;
- path/método removido;
- required parameter novo;
- propriedade removida;
- enum reduzido;
- operação frontend ausente;
- exceção válida e expirada.

## Aceite

- geração e guard determinísticos;
- sem credencial, dado real ou chamada externa;
- nenhum false `PASS` quando backend não inicia;
- resultado registra quantidade de paths, operações e schemas;
- nenhum código funcional alterado.
