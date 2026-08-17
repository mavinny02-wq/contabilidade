# STR-ARCH-BE-005 — remover o último finding Documento → Empresa

**Status:** `RELEASED_FOR_EXECUTION`  
**Owner:** porta de consulta Documento, adapter Empresa, testes e baseline arquitetural  
**Migration:** `NONE`

## Estado atual

O architecture guard está verde com 600 arestas e um único finding permitido:

```text
DocumentoService -> EmpresaRepository
rule: backend.common_to_feature
```

`DocumentoService` usa o repository da feature Empresa apenas para comprovar a existência da
empresa antes do upload/listagem.

## Objetivo

Substituir o acesso direto por uma porta mínima pertencente ao boundary de Documentos e uma
implementação dentro da feature Empresa, eliminando o último finding sem alterar o comportamento
visível.

## Escopo permitido

- contrato/porta em `common/document`;
- adapter mínimo dentro de `empresa`;
- `DocumentoService`;
- testes focados;
- `scripts/architecture/baseline.json`;
- `scripts/architecture/allowlist.json`;
- resultado da task.

## Aceite

1. `common/document` não importa classes de repository, entity, service ou DTO internos de Empresa.
2. A porta expõe somente a consulta necessária, preferencialmente existência por ID.
3. O adapter de Empresa preserva a autoridade de persistência e delega ao repository existente.
4. Empresa inexistente continua produzindo `EMPRESA_NAO_ENCONTRADA`.
5. Upload, deduplicação por hash, listagem, auditoria e storage permanecem semanticamente iguais.
6. Nenhum endpoint, payload, permissão, POM, migration ou schema é alterado.
7. Testes cobrem empresa existente/inexistente e a delegação do adapter.
8. O guard termina com:
   - `findings: 1 -> 0`;
   - nenhuma entrada restante na allowlist;
   - zero finding novo;
   - inventário determinístico.

## Validação

```text
Java 21
mvn -B -Dtest=DocumentoServiceTest,EmpresaDocumentoAdapterTest test
mvn -B -DskipTests test-compile
python3 scripts/architecture/architecture_guard.py inventory --output scripts/architecture/baseline.json
python3 scripts/architecture/architecture_guard.py check
git diff --check
```

`STR_ARCH_BE_005_READY`
