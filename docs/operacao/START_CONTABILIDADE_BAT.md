# Inicialização local por artefatos no Windows

**Classificação:** CANÔNICO_ATIVO
**Arquivo:** `START_CONTABILIDADE.bat`

## Contrato

O BAT compila o backend, o frontend e o worker no Windows e entrega ao Docker somente o JAR, o
`dist`, a configuração Nginx, o entrypoint de configuração em runtime e as dependências JavaScript
de produção do worker. Ele não executa Maven/npm em Docker, não usa o build do Compose, não chama
portais, não chama Serpro, não altera migrations ou dados e só derruba a pilha depois de todos os
artefatos, imagens e a configuração final terem sido validados.

## Pré-requisitos

- Windows 10/11, PowerShell, Docker Desktop com Compose, Maven e JDK 21;
- Node.js 22.12 ou superior e npm 10 ou superior;
- `package-lock.json` revisados no frontend e worker;
- Docker Desktop em modo de containers Linux;
- `.env` com segredos próprios para qualquer uso além de desenvolvimento.

Na ausência de lockfiles, execute conscientemente:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gerar-lockfiles.ps1
```

O BAT nunca gera lockfile silenciosamente. Em `dev`, um `.env` ausente é copiado de `.env.example`
com aviso e nunca sobrescrito. Em `onpremise`, a ausência do arquivo, o realm de desenvolvimento ou
segredos de exemplo interrompem a execução.

## Execução

```bat
START_CONTABILIDADE.bat
START_CONTABILIDADE.bat dev
START_CONTABILIDADE.bat onpremise
```

`dev` combina `compose.yaml`, `compose.dev.yaml` e o override gerado. `onpremise` combina o base,
`compose.onpremise.yaml` e o override. O diretório é derivado de `%~dp0`, portanto o duplo clique é
suportado. O terminal permanece aberto em sucesso ou falha.

## Artefatos e imagens

São produzidas imagens versionadas `contabilidade-backend:<VERSION>`,
`contabilidade-frontend:<VERSION>` e `contabilidade-automation-worker:<VERSION>`, todas com o rótulo
`contabilidade.local.artifact-only=true`. Os contextos ficam em:

```text
.docker-local/artifact-build/backend-context
.docker-local/artifact-build/frontend-context
.docker-local/artifact-build/worker-context
.docker-local/artifact-build/compose.artifacts.yaml
```

O worker usa a imagem Playwright `v1.60.0-noble`, igual à dependência direta. Como o grafo atual é
JavaScript, `npm ci --omit=dev --ignore-scripts` é feito no host e o conjunto de produção é copiado.
Essa estratégia depende do grafo continuar sem addon nativo; uma futura dependência nativa exige
revisão específica para ABI Linux, não cópia automática de `node_modules` do Windows.

## Sequência e saúde

1. preflight e Compose `config` sem tocar em containers;
2. Maven `clean package` e seleção segura do JAR executável;
3. `npm ci`, i18n e build do frontend;
4. `npm ci`, typecheck, build e pacote de produção do worker;
5. contextos isolados, imagens runtime e verificação de conteúdo/rótulos;
6. `down`, depois `up --no-build -d`;
7. espera por PostgreSQL, Keycloak, backend, worker e frontend;
8. `nginx -t`, readiness do backend, `/health` do worker e `/healthz` do frontend;
9. `docker compose ps` e abertura de `http://localhost:8088`.

Uma falha mostra logs direcionados. Somente mensagens específicas de corrupção de snapshot do
BuildKit autorizam uma limpeza do cache do builder e uma única repetição; não há prune de sistema,
remoção de volume ou descarte de arquivos.

## Parada

Use os scripts existentes ou a mesma combinação do modo utilizado:

```powershell
.\scripts\parar.ps1
```

## Solução de problemas e limitações

- `npm ci` exige lockfiles existentes e coerentes; não use `npm install` como atalho on-premise.
- Docker Desktop deve aceitar bind mounts, imagens Linux, `ipc: host` e o perfil seccomp do worker.
- A porta 3001 existe no override `dev`; em on-premise o BAT tenta a saúde interna se ela não estiver
  publicada.
- Antivírus e caminhos longos podem tornar a cópia de `node_modules` lenta.
- Segredos continuam apenas no `.env`/ambiente Compose e não são copiados para os contextos.
- HTTPS, backup/restauração comprovados e credenciais não demonstrativas continuam obrigatórios para
  prontidão on-premise.
