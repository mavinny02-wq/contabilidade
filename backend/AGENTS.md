# Regras de agentes — backend

Este arquivo especializa o contrato da raiz para `backend/**`.

## Autoridade e domínio

- Java 21, Spring Boot, PostgreSQL e Flyway são as bases atuais.
- Regras fiscais, autorização, transições, validação, custos, idempotência e dados derivados são
  autoridade do backend.
- Controllers não duplicam regra de domínio; serviços não dependem de estado de UI.
- DTOs externos devem ser explícitos e display-ready quando o backend é o owner da decisão.
- Autorização server-side é obrigatória; estado desabilitado no frontend é somente UX.

## Persistência e migrations

- Flyway é o único owner de schema.
- Nunca altere migration aplicada; crie a próxima migration monotônica.
- Uma onda possui no máximo um owner de migration.
- Antes de criar migration, confira
  `docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md` e o inventário real de
  `backend/src/main/resources/db/migration/`.
- Não crie sequência concorrente a partir de baseline desatualizado.
- Mudança de contrato persistente atualiza consumidores e fixtures tipadas no mesmo owner quando
  autorizado; caso contrário, registre blocker exato.

## Segurança e integrações

- Não exponha segredo, token, certificado, cookie, documento ou PII em logs/erros.
- Chamadas fiscais reais e pagas permanecem desabilitadas em build/teste comum.
- Provedores são substituíveis; falha externa não determina status fiscal por inferência.
- Documento deve ser autorizado e validado antes de leitura/download.

## Validação estrutural comum

```text
cd backend
mvn -B -DskipTests test-compile
```

Acrescente checks estáticos/Flyway proporcionais. Não execute testes em task comum; uma task
explicitamente de validação pode usar apenas o owner de prova liberado.
