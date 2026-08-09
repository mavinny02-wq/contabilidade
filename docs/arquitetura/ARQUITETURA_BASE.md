# Arquitetura base

## Forma

Monólito modular para domínio e APIs, com worker Playwright separado.

```text
Navegador
   ↓
Nginx / Frontend React
   ↓
Spring Boot modular
   ↓
PostgreSQL + storage de documentos
   ↓
Execuções/providers
   ↓
Worker Playwright ou API externa
```

## Autoridades

- PostgreSQL é a fonte de verdade.
- Flyway é o único mecanismo de schema.
- Backend decide autorização e estados.
- O worker não decide regularidade fiscal.
- Provider específico não vaza para a UI.
- Falha externa não produz estado fiscal verde/vermelho automaticamente.

## Implantação

A aplicação inicia on-premise, porém URL, storage, secrets e providers permanecem configuráveis para
permitir migração futura para nuvem.
