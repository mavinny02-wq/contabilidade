# Arquitetura base

```text
React + TypeScript
      |
Spring Boot modular
      |
PostgreSQL + storage de objetos
      |
Execuções/fila
      |
Workers Playwright
      |
APIs e portais externos
```

Monólito modular inicialmente. Browser automation fica fora da thread HTTP. PostgreSQL é autoritativo. Flyway é o único mecanismo de migration.
