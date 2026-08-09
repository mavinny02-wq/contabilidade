# Runbook inicial

## Comandos

```powershell
.\scripts\status.ps1
.\scripts\logs.ps1 backend
.\scripts\backup.ps1
docker compose restart backend
docker compose restart automation-worker
```

## Portal indisponível

- não marcar empresa como irregular;
- registrar execução como fonte indisponível;
- respeitar retry;
- escalar somente após limite.

## Disco baixo

- pausar uploads/automações;
- executar backup;
- liberar espaço com política aprovada;
- não apagar evidência rastreável manualmente.

## Worker indisponível

- consultar logs;
- verificar memória compartilhada;
- reiniciar worker;
- validar heartbeat;
- manter jobs na fila.
