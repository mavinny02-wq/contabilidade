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

O BAT delega a estabilização dos containers para:

```text
scripts/start-compose-sequential.bat
```

A revisão operacional `STABLE-NETWORK-PROBE-2026-08-11-06` inicia e comprova os serviços nesta
ordem:

```text
PostgreSQL
    ↓ healthy
postgres-bootstrap
    ↓ exit code 0
Keycloak
    ↓ Docker healthcheck healthy
Backend
    ↓ readiness
schemas Keycloak/Flyway
    ↓ válidos
Automation worker
    ↓ /health
Frontend
    ↓ /healthz e nginx -t
```

Cada etapa possui timeout próprio e logs direcionados. Se o primeiro `docker compose up` de um
serviço retornar erro enquanto o container ainda pode reiniciar e se recuperar, o script continua
monitorando até o timeout em vez de encerrar prematuramente.

## Sonda de readiness da rede

A readiness do backend precisa ser consultada de dentro da rede Compose também no modo on-premise,
em que a porta 8080 não é publicada no Windows.

A implementação antiga executava repetidamente:

```text
docker compose run --rm ... frontend wget http://backend:8080/...
```

Isso criava containers one-shot com nomes como:

```text
contabilidade-frontend-run-<id>
```

Eles desapareciam por causa de `--rm` e podiam exibir `wget: bad address 'backend:8080'` enquanto o
backend ainda não havia sido criado. Esses containers não eram o frontend real, mas a nomenclatura
causava uma interpretação incorreta de crash do frontend.

A revisão atual cria uma única sonda temporária e identificável:

```text
contabilidade-startup-probe
```

Ela:

- usa a imagem frontend apenas pelo `wget` do Alpine;
- substitui o entrypoint para não iniciar Nginx;
- permanece ativa durante a espera do backend;
- não publica portas;
- não executa a aplicação frontend;
- é removida explicitamente em sucesso ou falha;
- não produz containers `frontend-run-*` a cada tentativa.

O Keycloak agora é considerado pronto somente quando o healthcheck Docker está `healthy`, evitando
que o backend seja solicitado antes de a condição `depends_on` estar satisfeita. Caso o backend
não tenha sido criado, o comando `up backend` é repetido durante a espera.

O frontend real continua sendo:

```text
contabilidade-frontend-1
```

Ele é iniciado somente na etapa final e deve permanecer em execução.

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
- `postgres-bootstrap` concluído com código zero;
- Keycloak `healthy`;
- backend readiness;
- schemas PostgreSQL, Flyway e Liquibase;
- automation worker `/health`;
- frontend `/healthz`;
- `nginx -t` já dentro da rede Compose.

## Memória do WSL

BuildKit e o page cache do WSL podem manter memória alocada depois de builds. O START não executa
limpeza automática para não perder cache útil nem interromper containers. A limpeza deve continuar
sendo uma ação operacional separada e explícita.
