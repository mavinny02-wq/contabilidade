# Resultado — FIX_PRIMA_FULL_COMPOSE_STARTUP_001

## Identificação

- **Item:** `FIX_PRIMA_FULL_COMPOSE_STARTUP_001`
- **Status:** `CORRIGIDO_ESTRUTURALMENTE_WINDOWS_RUNTIME_PENDENTE`
- **Classificação:** `PRODUCT_REGRESSION`
- **Baseline:** `7ad3c196c725228a4f4ea503473e73154a4c9831`
- **Referência:** `mavinny02-wq/euro_rail`, fluxo local artifact-only da branch `release/1.0.0`
- **Migration:** nenhuma

## Problemas confirmados

### Startup diferente do PRIMA

O Contabilidade executava vários comandos independentes:

```text
compose up --no-build --no-deps postgres
compose up --no-build --no-deps postgres-bootstrap
compose up --no-build --no-deps keycloak
compose up --no-build --no-deps --force-recreate backend
compose up --no-build --no-deps --force-recreate automation-worker
compose up --no-build --no-deps --force-recreate frontend
```

No modo `dev`, o script ainda parava e removia `keycloak` e `postgres-bootstrap`, enquanto o frontend e o
backend recebiam autenticação desabilitada.

O PRIMA usa uma única transição Compose depois de build/imagens. O Compose cria a stack completa e
`depends_on`, healthchecks e `--wait` governam a ordem real.

### HTTP 500 na raiz do frontend

O log real mostrou:

```text
rewrite or internal redirection cycle while internally redirecting to "/index.html"
GET / HTTP/1.1 500
```

O `frontend/nginx.conf` customizado substituía o `default.conf` da imagem oficial, mas não declarava:

```nginx
root /usr/share/nginx/html;
index index.html;
```

A regra SPA redirecionava para `/index.html` sem uma raiz de documentos válida e entrava em ciclo.

## Correção

### Stack dev completa

`compose.dev.yaml` agora mantém o perfil `local`, mas configura:

```text
APP_ENVIRONMENT=LOCAL
APP_SECURITY_ENABLED=true
APP_AUTH_ENABLED=true
```

O modo de desenvolvimento sobe:

```text
postgres
postgres-bootstrap
keycloak
backend
automation-worker
frontend
```

### Uma única transição Compose

`scripts/start-compose-sequential.ps1` mantém o nome por compatibilidade, mas não realiza mais startup
sequencial por serviço e não cria probe temporário.

A única mutação de startup é:

```text
docker compose ... up --no-build -d --remove-orphans --wait --wait-timeout 720
```

Não existem mais no caminho oficial:

```text
--no-deps
--force-recreate
Remove-DevAuthContainers
Start-ContabilidadeStartupProbe
Invoke-ContabilidadeStartupProbeRequest
compose stop/rm por serviço
```

A execução não usa `down -v` nem remove volumes. Uma segunda chamada converge a mesma stack.

### Validação pós-start

Depois que o Compose declara prontidão, o startup exige:

- `nginx -t` dentro da rede Compose;
- backend readiness acessado pelo frontend;
- health do automation worker;
- HTTP 200 em `/healthz`;
- HTTP 200 e documento HTML em `/`;
- HTTP 200 em `/api/info`;
- HTTP 200 no discovery do realm Keycloak pelo proxy `/auth`;
- schemas Liquibase do Keycloak;
- Flyway V1–V12.

Em falha, o script mostra `compose ps -a` e logs bounded dos seis serviços.

### SPA Nginx

O frontend agora declara:

```nginx
root /usr/share/nginx/html;
index index.html;

location = /index.html {
  try_files /index.html =404;
}
```

A localização exata transforma um artefato ausente em 404 determinístico, em vez de redirecionamento
interno recursivo.

## Safeguards

Foi criado:

```text
scripts/tests/assert-prima-compose-startup-contract.ps1
```

O guard exige:

- exatamente uma chamada Compose `up`;
- `--no-build`, `--remove-orphans`, `--wait` e timeout;
- ausência do orquestrador por serviço e do probe;
- seis serviços obrigatórios;
- autenticação habilitada no modo dev;
- raiz/index do SPA;
- validação Keycloak + Flyway nos dois modos;
- teste HTTP da raiz no startup.

O workflow:

```text
.github/workflows/prima-full-compose-startup.yml
```

executa:

- parser e contrato no Windows PowerShell;
- build frontend;
- contratos de runtime/auth;
- Nginx real com o `dist`;
- HTTP 200 da raiz;
- rejeição explícita de `rewrite or internal redirection cycle`.

## Escopo preservado

Não foram alterados:

- migrations;
- dados ou volumes;
- código Java/TypeScript funcional;
- dependências ou lockfiles;
- providers fiscais;
- imagens-base.

## Prova local após integração

Como `compose.dev.yaml`, `nginx.conf` e a imagem frontend mudaram:

```powershell
git switch main
git pull --ff-only
.\START_CONTABILIDADE.bat build
.\START_CONTABILIDADE.bat start
```

A saída de startup deve anunciar uma única transição Compose e listar os seis serviços.

Validação:

```powershell
curl.exe -fsS http://localhost:8088/healthz
curl.exe -fsS http://localhost:8088/
curl.exe -fsS http://localhost:8088/api/info
curl.exe -fsS http://localhost:8088/auth/realms/contabilidade/.well-known/openid-configuration
```

A prova autoritativa final permanece Windows PowerShell 5.1 + Docker Desktop no SHA integrado.
