# Build Docker resiliente e deploy on-premise sem build

## Objetivo

Evitar limpeza manual e abrangente do Docker Desktop quando o BuildKit perde a referência interna de um snapshot, e impedir que esse tipo de cache exista no caminho normal de produção.

## Desenvolvimento e validação local

`START_CONTABILIDADE.bat` agora usa um builder dedicado:

```text
contabilidade-runtime-builder
```

O builder usa o driver `docker-container`, mantém o próprio estado em volume exclusivo do BuildKit e carrega automaticamente as imagens resultantes no Docker Engine.

O fluxo é:

1. validar Docker e Buildx;
2. criar ou reutilizar o builder isolado;
3. executar o build e startup existentes;
4. se houver falha comum, preservar o builder e devolver o erro original;
5. se o log comprovar corrupção de snapshot, remover somente o builder isolado;
6. recriar o builder e repetir uma vez;
7. nunca executar `docker system prune`, `docker volume prune` ou `docker compose down -v`.

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
- containers de produção;
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

Para diagnóstico, a recuperação automática pode ser desabilitada chamando diretamente:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\start-contabilidade-resilient.ps1 `
  -Mode dev `
  -NoAutoRecovery
```

## Produção on-premise

Produção não deve compilar Maven/npm nem construir imagens Docker no servidor de execução.

Use:

```powershell
.\DEPLOY_CONTABILIDADE_ONPREMISE.bat
```

Esse fluxo:

- não executa `docker build`;
- não usa cache BuildKit;
- não limpa cache;
- valida as imagens já carregadas;
- gera o override com `build: null`;
- executa o startup sequencial já existente;
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

Para baixar as imagens antes do deploy:

```powershell
.\DEPLOY_CONTABILIDADE_ONPREMISE.bat pull
```

Para exigir referências imutáveis por digest:

```powershell
.\DEPLOY_CONTABILIDADE_ONPREMISE.bat pull digest
```

Sem `pull`, todas as imagens precisam estar previamente carregadas no Docker Engine.

## Publicação recomendada

O pipeline de entrega deve:

1. executar Maven, frontend, worker e E2E em ambiente de build;
2. construir as três imagens fora do servidor produtivo;
3. publicar cada imagem em registry privado;
4. registrar os digests SHA-256 aprovados;
5. atualizar as três referências no `.env` produtivo;
6. executar `DEPLOY_CONTABILIDADE_ONPREMISE.bat pull digest`;
7. manter a versão anterior disponível para rollback.

## Rollback

Para voltar à versão anterior:

1. restaurar no `.env` os três digests anteriores;
2. executar novamente:

```powershell
.\DEPLOY_CONTABILIDADE_ONPREMISE.bat pull digest
```

O rollback de aplicação não apaga o volume PostgreSQL. Compatibilidade de schema deve ser confirmada pela política de release antes da troca de versão.
