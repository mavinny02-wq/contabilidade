# ARQUIVADO — SEC-DOC-001

> Não executar novamente. Implementação integrada pela PR `#18`.

- **ITEM:** `SEC-DOC-001`
- **STATUS:** `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
- **BRANCH:** `feat/sec-doc-001-integrity-download`
- **PR:** `#18`
- **MERGE:** `b50fd182e4e4e1d0c1573bcb9e43fd8ff368cf01`
- **EVIDÊNCIA:** `docs/implementacao/SEC_DOC_001_INTEGRIDADE_DOWNLOAD.md`

## Resultado implementado

- tamanho e SHA-256 recalculados antes do download;
- comparação de digest em tempo constante;
- entrega dos mesmos bytes verificados;
- divergência ou impossibilidade de verificação bloqueia a resposta;
- evidência não é apagada automaticamente;
- ocorrência segura persistida em auditoria isolada.

## Estado de validação

Permanecem pendentes Maven, download íntegro real, adulteração controlada do storage, arquivo
ausente/ilegível e confirmação da auditoria persistida após recusa.
