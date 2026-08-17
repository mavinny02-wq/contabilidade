# STR-OPS-002 — harness seguro de recovery rehearsal

**Status:** `RELEASED_FOR_EXECUTION`  
**Owner:** schema/planejador/fixtures/workflow de recovery  
**Migration:** `NONE`

## Problema

Os backups possuem manifesto, tamanho e SHA-256, mas ainda não existe um harness versionado que
valide a completude do conjunto, produza uma ordem de restauração e registre RPO/RTO sem tocar um
ambiente real.

## Objetivo

Criar um planejador e guard offline para recovery rehearsal. A task prepara a prova; não restaura a
base do usuário, não acessa backups reais e não modifica os scripts de backup existentes.

## Escopo permitido

- `scripts/recovery/**`;
- schemas, policy, fixtures e testes sintéticos;
- workflow dedicado;
- resultado da task.

`scripts/backup.*`, volumes, Compose, banco, documentos e backups reais são somente leitura.

## Entrada mínima

```text
backupSetId sintético
createdAt
applicationVersion
gitCommit
flywayFrontier
databaseDump { path lógico, size, sha256 }
documentsArchive { path lógico, size, sha256 }
manifestSha256
encryptionMetadata sem chave
```

## Aceite

1. Conjunto incompleto, hash/tamanho inválido ou componente duplicado falha antes de qualquer ação.
2. O plano determinístico define: verificar, provisionar alvo vazio, restaurar banco, validar Flyway,
   restaurar documentos, reconciliar storage e executar checks.
3. O alvo deve ser explicitamente efêmero/não produtivo; alvo ausente ou produtivo é recusado.
4. O planner nunca executa `drop`, `rm`, `docker volume rm`, `compose down -v` ou restauração.
5. RPO é calculado a partir de timestamps declarados; RTO é um contrato de medição, não um número
   inventado.
6. Fixtures cobrem conjunto válido, dump ausente, archive ausente, checksum divergente, frontier
   incompatível, backup antigo, target inseguro e ordem inválida.
7. Findings não exibem nomes de clientes, paths físicos, conteúdo, segredo ou chave.
8. Duas gerações do plano são byte-idênticas.
9. Workflow dedicado executa schema, testes e guard apenas com fixtures sintéticas.
10. A execução real continua em `STR-OPS-001`, fora desta task.

`STR_OPS_002_READY`
