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

A configuração atual usa o projeto em `D:\priv\priv\projeto\contabilidade` e o mesmo JDK 21 já
utilizado pelo PRIMA em `C:\work\java\zulu21.44.17-ca-jdk21.0.8-win_x64`.

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

A revisão `FULL-REBUILD-SEQUENTIAL-STARTUP-FIX-2026-08-10-04` não trata o retorno imediato de um único
`docker compose up` como única prova de sucesso. Os serviços são iniciados e estabilizados nesta
ordem:

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

Cada etapa possui timeout próprio e logs direcionados. Se um primeiro `docker compose up` retornar
erro enquanto um container reinicia durante o bootstrap, o BAT continua monitorando até o timeout em
vez de encerrar prematuramente.

## PostgreSQL

O script `infra/postgres/init/01-create-keycloak-db.sh` mantém a criação do banco do Keycloak
idempotente e não contém mais a sequência literal inválida `\n` antes de `\gexec`.

O healthcheck do PostgreSQL possui período inicial de tolerância para permitir `initdb` e scripts de
bootstrap antes de o Docker considerar o container unhealthy.

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
