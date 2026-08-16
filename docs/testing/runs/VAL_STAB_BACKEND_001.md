# VAL-STAB-BACKEND-001 — validação de estabilidade do backend

## Identificação

- **Task:** `VAL-STAB-BACKEND-001`
- **Baseline disponível:** commit `7c6079caa54d1e7526a3e03c5ee41893581ff9b1` (`work`), usado para preparar a branch `backend-validation`.
- **Data da execução (UTC):** 2026-08-16
- **Escopo:** validação somente leitura de `backend/**`; nenhuma migração ou alteração de código foi realizada.
- **Locks declarados:** `LOCK-EXT-001`, `LOCK-DATA-001`, `LOCK-TEST-001`, `LOCK-EVID-001`.

## Arquivos lidos

- `AGENTS.md`.
- `backend/AGENTS.md`: não existe no baseline disponível.
- `docs/testing/MASTER_TEST_ORCHESTRATION.md`: não existe no baseline disponível.

## Comando executado

```bash
cd backend && mvn -B clean verify
```

## Resultado

- **Estado:** falha.
- **Código de saída:** `1`.
- **Total de testes:** `5`.
- **Falhas:** `0`.
- **Erros:** `1`.
- **Ignorados:** `0`.
- **Teste com erro:** `BancoPostgresqlIntegracaoTest.deveAplicarTodasAsMigracoesEValidarEstruturaMaisRecente`.
- **Primeira causa raiz:** `java.net.ConnectException: Connection refused`, ao tentar conectar ao PostgreSQL em `127.0.0.1:5432`. A indisponibilidade impediu o Flyway de obter conexão e, por consequência, a inicialização do `ApplicationContext`.
- **Fase interrompida:** `maven-surefire-plugin:3.5.6:test`; o build terminou como `BUILD FAILURE`.
- **Tempo informado pelo Maven:** `38.388 s`.

## Comportamento preservado

A validação não alterou o backend, testes, configuração, schema ou migrações. O resultado distingue uma indisponibilidade da dependência PostgreSQL de uma falha de asserção: não houve falhas de teste, mas houve um erro de infraestrutura durante a inicialização do teste de integração.

## Pendências

- Disponibilizar uma instância PostgreSQL compatível em `127.0.0.1:5432`, com as credenciais esperadas pelo perfil `local`, e repetir exatamente o comando de validação.
- Restaurar ou fornecer `backend/AGENTS.md` e `docs/testing/MASTER_TEST_ORCHESTRATION.md` caso sejam artefatos obrigatórios da baseline pretendida.
