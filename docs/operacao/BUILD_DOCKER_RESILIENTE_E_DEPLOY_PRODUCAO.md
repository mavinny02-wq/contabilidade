# Build Docker resiliente e deploy on-premise sem build

## Objetivo

Evitar limpeza manual e abrangente do Docker Desktop quando o BuildKit perde a referência interna de
um snapshot, impedir que esse cache exista no caminho normal de produção e manter um único ponto de
entrada na raiz do projeto.

## Único ponto de entrada

Todos os fluxos operacionais partem de:

```text
START_CONTABILIDADE.bat
```

Os scripts internos ficam em `scripts/` e não devem ser executados diretamente no uso normal.

## Desenvolvimento e validação local

Execute por duplo clique ou:

```powershell
.\START_CONTABILIDADE.bat dev
```

O startup usa o builder dedicado:

```text
contabilidade-runtime-builder
```

O builder usa o driver `docker-container`, mantém o próprio estado em volume exclusivo do BuildKit e
carrega automaticamente as imagens resultantes no Docker Engine.

O fluxo é:

1. validar Docker e Buildx;
2. criar ou reutilizar o builder isolado;
3. executar Maven e npm no Windows;
4. construir imagens runtime-only;
5. se houver falha comum, preservar o builder e devolver o erro original;
6. se o log comprovar corrupção de snapshot, remover somente o builder isolado;
7. recriar o builder e repetir uma vez;
8. nunca executar `docker system prune`, `docker volume prune` ou `docker compose down -v`.

Assinaturas tratadas:

```text
failed to prepare extraction snapshot
parent snapshot ... does not exist
snapshot ... not found
failed to get layer ... not found
```

A recuperação não remove:

- volume PostgreSQL;
- documentos;
- backups;
- imagens da aplicação já válidas;
- containers da aplicação;
- redes ou volumes do Compose.

Logs:

```text
.docker-local/logs/START_CONTABILIDADE_RESILIENTE_<data>_tentativa1.log
.docker-local/logs/START_CONTABILIDADE_RESILIENTE_<data>_tentativa2.log
```

O nome do builder pode ser alterado:

```powershell
$env:CONTABILIDADE_BUILDER_NAME = 'contabilidade-runtime-builder-02'
.\START_CONTABILIDADE.bat dev
```

## Serviços no modo dev

O `compose.dev.yaml` desabilita autenticação. Portanto o startup inicia apenas:

```text
PostgreSQL
backend
automation-worker
frontend
```

`postgres-bootstrap` e Keycloak são removidos do ambiente dev, pois não são necessários. O startup
não executa mais `docker compose down`; PostgreSQL é preservado e apenas os serviços da aplicação são
recriados após o build.

## Produção on-premise

Produção não deve compilar Maven/npm nem construir imagens Docker no servidor de execução.

Use o mesmo BAT:

```powershell
.\START_CONTABILIDADE.bat onpremise pull digest
```

Esse fluxo:

- não executa `docker build`;
- não usa cache BuildKit;
- não limpa cache;
- valida ou baixa imagens já publicadas;
- pode exigir referências imutáveis por digest;
- gera o override com `build: null`;
- inicia PostgreSQL, bootstrap, Keycloak, backend, worker e frontend em sequência;
- mantém as validações PostgreSQL, Keycloak, Flyway, worker e frontend.

Imagens padrão:

```text
contabilidade-backend:<VERSION>
contabilidade-frontend:<VERSION>
contabilidade-automation-worker:<VERSION>
```

Para usar registry, configure no `.env` ou no ambiente do processo:

```dotenv
CONTABILIDADE_BACKEND_IMAGE=registry.example/contabilidade/backend@sha256:<digest>
CONTABILIDADE_FRONTEND_IMAGE=registry.example/contabilidade/frontend@sha256:<digest>
CONTABILIDADE_WORKER_IMAGE=registry.example/contabilidade/worker@sha256:<digest>
```

Comandos disponíveis:

```powershell
# usa imagens já carregadas
.\START_CONTABILIDADE.bat onpremise

# baixa imagens por tag ou digest
.\START_CONTABILIDADE.bat onpremise pull

# baixa e exige digest imutável
.\START_CONTABILIDADE.bat onpremise pull digest
```

## Keycloak

No on-premise, a primeira inicialização pode executar augmentação e importação do realm. O startup
aguarda até 600 segundos por padrão e reporta o estado em intervalos de 15 segundos. Em execuções
seguintes, o container saudável é reutilizado porque a stack não é derrubada integralmente.

## Publicação recomendada

O pipeline de entrega deve:

1. executar Maven, frontend, worker e E2E em ambiente de build;
2. construir as três imagens fora do servidor produtivo;
3. publicar cada imagem em registry privado;
4. registrar os digests SHA-256 aprovados;
5. atualizar as três referências no `.env` produtivo;
6. executar `START_CONTABILIDADE.bat onpremise pull digest`;
7. manter a versão anterior disponível para rollback.

## Rollback

Para voltar à versão anterior:

1. restaurar no `.env` os três digests anteriores;
2. executar novamente:

```powershell
.\START_CONTABILIDADE.bat onpremise pull digest
```

O rollback de aplicação não apaga o volume PostgreSQL. Compatibilidade de schema deve ser confirmada
pela política de release antes da troca de versão.

## Manutenção manual de memória

O utilitário foi retirado da raiz e permanece acessível pelo único ponto de entrada:

```powershell
.\START_CONTABILIDADE.bat memoria
```

Ele nunca é executado automaticamente pelo startup ou pelo deploy.
