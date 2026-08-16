# START_CONTABILIDADE — ponto único de inicialização

## Regra principal

Existe apenas um BAT operacional na raiz para iniciar ou implantar a aplicação:

```text
START_CONTABILIDADE.bat
```

Os BATs internos ficam em `scripts/` e não devem ser executados diretamente.

## Desenvolvimento

Duplo clique em `START_CONTABILIDADE.bat` ou execute:

```powershell
.\START_CONTABILIDADE.bat dev
```

O modo `dev`:

1. valida Java 21, Maven, Node, npm, Docker e Compose;
2. compila backend, frontend e automation worker no Windows;
3. cria imagens runtime-only com os artefatos prontos;
4. inicia somente:
   - PostgreSQL;
   - backend;
   - automation worker;
   - frontend;
5. valida Flyway V1–V12, readiness, health e Nginx;
6. abre `http://localhost:8088`.

A autenticação está desabilitada em `compose.dev.yaml`. Por isso, `postgres-bootstrap` e Keycloak não
são necessários e são removidos do ambiente de desenvolvimento. Isso reduz memória e evita esperar a
augmentação do Keycloak sem necessidade.

O startup não executa mais `docker compose down`. PostgreSQL permanece em execução e apenas backend,
worker e frontend são recriados depois que as novas imagens ficam prontas.

## Produção on-premise

Use o mesmo BAT:

```powershell
.\START_CONTABILIDADE.bat onpremise pull digest
```

Esse modo:

- não executa Maven;
- não executa npm;
- não executa `docker build`;
- baixa e usa imagens previamente publicadas;
- exige referências por digest quando `digest` é informado;
- inicia PostgreSQL, bootstrap, Keycloak, backend, worker e frontend na ordem correta.

## Keycloak

No modo on-premise, a primeira inicialização do Keycloak pode executar augmentação e importação do
realm. O timeout padrão é de 600 segundos e o script mostra o estado a cada 15 segundos, em vez de
encerrar prematuramente em 60 tentativas.

Nas execuções seguintes, o container saudável é reutilizado; o startup não derruba a stack inteira.

## BuildKit resiliente

O desenvolvimento usa o builder isolado:

```text
contabilidade-runtime-builder
```

Se ocorrer corrupção conhecida de snapshot, somente esse builder é recriado e o build é repetido uma
vez. Volumes PostgreSQL, documentos, backups e containers da aplicação não são apagados.

## Manutenção de memória

O utilitário continua disponível pelo mesmo BAT:

```powershell
.\START_CONTABILIDADE.bat memoria
```

Ele nunca é executado automaticamente.

## Logs

```text
.docker-local\logs\START_CONTABILIDADE_RESILIENTE_<data>_tentativa1.log
.docker-local\logs\START_CONTABILIDADE_RESILIENTE_<data>_tentativa2.log
```

## Estado esperado no Docker Desktop

### Desenvolvimento

```text
postgres             running / healthy
backend              running
automation-worker    running / healthy
frontend             running / healthy
```

### On-premise

```text
postgres             running / healthy
postgres-bootstrap   exited / 0
keycloak             running / healthy
backend              running
automation-worker    running / healthy
frontend             running / healthy
```

`postgres-bootstrap` é um job one-shot. No on-premise, terminar com `Exited (0)` é sucesso, não uma
falha.
