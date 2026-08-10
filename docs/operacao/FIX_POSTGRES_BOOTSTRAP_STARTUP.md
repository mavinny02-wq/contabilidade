# Correção do bootstrap PostgreSQL e da ordem de inicialização

## Problema observado

Na primeira criação do volume, o script `01-create-keycloak-db.sh` continha um comando `psql`
inválido. O PostgreSQL chegava a ficar disponível, mas o entrypoint terminava com erro e o Compose
interrompia os serviços dependentes.

Em volumes que já haviam sido inicializados parcialmente, o entrypoint oficial do PostgreSQL pulava
os scripts de `/docker-entrypoint-initdb.d`, portanto apenas corrigir o arquivo não seria suficiente.

## Solução

- o script de criação do banco `keycloak` agora é idempotente;
- o healthcheck do PostgreSQL usa TCP (`127.0.0.1`), evitando considerar saudável o servidor
  temporário usado durante o `initdb`;
- o serviço one-shot `postgres-bootstrap` executa em toda subida e garante o banco `keycloak`, mesmo
  quando o volume já existe;
- o startup sequencial aguarda explicitamente `postgres-bootstrap` terminar com código `0`;
- o Keycloak aguarda o bootstrap e seu próprio readiness;
- backend e frontend aguardam o Keycloak ficar saudável;
- `start_period`, intervalos e retries foram ampliados para suportar a primeira inicialização,
  importação do realm e migrations.

## Aplicação local

Depois de atualizar a branch `main`, não é necessário remover o volume PostgreSQL. Execute o BAT
normalmente. O serviço `postgres-bootstrap` corrigirá um volume parcialmente inicializado.

Para conferir o resultado:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml ps -a
docker compose -f compose.yaml -f compose.dev.yaml logs postgres postgres-bootstrap keycloak
```

O serviço `postgres-bootstrap` deve terminar com código `0`; isso é esperado para um serviço
one-shot.

## Segurança operacional

A alteração não apaga dados, não recria volumes e não executa chamadas fiscais externas.
