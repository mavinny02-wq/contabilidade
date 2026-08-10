# START_CONTABILIDADE.bat

**Classificação:** `CANÔNICO_ATIVO`  
**Modo padrão:** `dev`

## Objetivo

Compilar backend, frontend e automation worker na máquina Windows e entregar ao Docker somente os
artefatos preparados. O BAT não executa fluxo fiscal, não chama Serpro e não resolve CAPTCHA.

## Uso

Na raiz do projeto:

```bat
START_CONTABILIDADE.bat
START_CONTABILIDADE.bat dev
START_CONTABILIDADE.bat onpremise
```

O caminho do projeto é derivado de `%~dp0`. O JDK 21 pode ser informado por
`CONTABILIDADE_JAVA_HOME`; quando essa variável não existe, o BAT usa o mesmo Zulu 21 empregado no
PRIMA:

```text
C:\work\java\zulu21.44.17-ca-jdk21.0.8-win_x64
```

## Build artifact-only

Maven e npm executam no host. O BAT cria contextos em:

```text
.docker-local/artifact-build/backend-context
.docker-local/artifact-build/frontend-context
.docker-local/artifact-build/worker-context
```

Imagens geradas:

```text
contabilidade-backend:<VERSION>
contabilidade-frontend:<VERSION>
contabilidade-automation-worker:<VERSION>
```

Todas recebem o rótulo:

```text
contabilidade.local.artifact-only=true
```

O Docker não executa Maven ou npm e os containers existentes só são interrompidos depois que todos
os builds e verificações das imagens terminam.

## Inicialização controlada dos serviços

A revisão `COMPACT-SEQUENTIAL-2026-08-10-05` delega a estabilização dos containers para:

```text
scripts/start-compose-sequential.bat
```

Os serviços são iniciados e comprovados nesta ordem:

```text
PostgreSQL
    ↓ healthy
Keycloak
    ↓ realm disponível
Backend
    ↓ readiness
Automation worker
    ↓ /health
Frontend
    ↓ /healthz e nginx -t
```

Cada etapa possui timeout próprio e logs direcionados. Se o primeiro `docker compose up` de um
serviço retornar erro enquanto o container ainda pode reiniciar e se recuperar, o script continua
monitorando até o timeout em vez de encerrar prematuramente.

## PostgreSQL

O script `infra/postgres/init/01-create-keycloak-db.sh` mantém a criação do banco do Keycloak
idempotente e não contém mais a sequência literal inválida `\n` antes de `\gexec`.

O healthcheck do PostgreSQL possui `start_period` e tolerância ampliada para permitir `initdb` e os
scripts de bootstrap antes de o Docker considerar o container unhealthy.

## Segurança operacional

O BAT:

- não executa `git reset`, `git clean` ou `git stash`;
- não apaga volumes;
- não sobrescreve `.env` existente;
- recusa modo on-premise com secrets de exemplo;
- não chama portais, Serpro ou APIs pagas;
- não executa testes automatizados;
- mantém a janela aberta em sucesso ou falha.

## Serviços validados

Após a subida:

- PostgreSQL `healthy`;
- realm do Keycloak acessível;
- backend readiness;
- automation worker `/health`;
- frontend `/healthz`;
- `nginx -t` já dentro da rede Compose.

## Memória do WSL

BuildKit e o page cache do WSL podem manter memória alocada depois de builds. O START não executa
limpeza automática para não perder cache útil nem interromper containers. A limpeza deve continuar
sendo uma ação operacional separada e explícita.
