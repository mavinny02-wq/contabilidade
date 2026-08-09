# Backup e restauração

## Backup

Execute `scripts/backup.ps1` ou `scripts/backup.sh`.

São gerados:

- dump PostgreSQL;
- arquivo compactado dos documentos.

## Regra 3-2-1 mínima

- cópia operacional no servidor;
- cópia em mídia/servidor diferente;
- uma cópia externa, offline ou imutável;
- criptografia;
- teste de restauração periódico.

## Restauração

A restauração é deliberadamente manual nesta baseline:

1. desligar backend/worker;
2. preservar estado atual;
3. restaurar dump em banco limpo;
4. restaurar documentos;
5. validar Flyway;
6. iniciar serviços;
7. validar empresas/documentos/downloads;
8. registrar evidência.

Nunca restaure por cima de produção sem janela e backup imediatamente anterior.
