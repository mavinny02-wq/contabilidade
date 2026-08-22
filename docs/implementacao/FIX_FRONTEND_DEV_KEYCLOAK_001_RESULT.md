# Resultado — FIX_FRONTEND_DEV_KEYCLOAK_001

## Identificação

- **Item:** `FIX_FRONTEND_DEV_KEYCLOAK_001`
- **Status:** `CORRIGIDO_ESTRUTURALMENTE_WINDOWS_RUNTIME_PENDENTE`
- **Classificação:** `PRODUCT_REGRESSION`
- **Baseline:** `e830bfc75869d56cb6d2907383c2a513a2038c39`
- **Referência:** modelo de frontend runtime do `mavinny02-wq/euro_rail`, branch `release/1.0.0`
- **Migration:** nenhuma

## Falha observada

O frontend entrava em restart loop no modo `dev`:

```text
nginx: [emerg] host not found in upstream "keycloak"
```

A configuração base do frontend continha uma rota `/auth/` com `proxy_pass` direto para
`http://keycloak:8080/auth/`. Ao mesmo tempo, `compose.dev.yaml` define autenticação como desabilitada e
o startup sequencial remove `keycloak` e `postgres-bootstrap` no modo `dev`.

O Nginx resolve upstreams estáticos ao carregar a configuração. Como `keycloak` não existe na rede
Compose de desenvolvimento, o processo principal encerra. A política `restart: unless-stopped` reinicia
o container, produzindo o ciclo repetido observado nos logs.

## Comparação com PRIMA

O frontend do PRIMA usa configuração runtime e não mantém uma dependência incondicional de Nginx com
um serviço de autenticação deliberadamente ausente. O contrato transportado para Contabilidade é:

- configuração base não referencia upstream opcional;
- modo de autenticação decide a configuração runtime;
- configuração é validada antes do processo principal do Nginx;
- falha de configuração permanece bloqueante e explícita.

## Correção

### Nginx base sem dependência opcional

`frontend/nginx.conf` não contém mais `proxy_pass http://keycloak...`. Em seu lugar, inclui:

```nginx
include /etc/nginx/contabilidade/auth-location.conf;
```

### Renderização condicionada por `APP_AUTH_ENABLED`

`frontend/docker-entrypoint.d/40-runtime-config.sh` valida `APP_AUTH_ENABLED` e sempre cria o include:

- `false`: arquivo apenas com comentário; nenhuma referência a Keycloak;
- `true`: rota `/auth/` completa apontando para `keycloak:8080`.

O mesmo valor é gravado em `config.js`, evitando divergência entre o browser e o Nginx. Valores que não
sejam exatamente `true` ou `false` são rejeitados.

O entrypoint executa `nginx -t` depois de renderizar a configuração. Assim, erro de Nginx aparece antes
do processo principal e antes do restart loop.

### Verificação de imagem runtime

`scripts/verify-runtime-images.ps1` agora executa dentro da imagem frontend:

- renderização com autenticação desabilitada;
- `nginx -t` sem Keycloak presente;
- comprovação de que o include desabilitado não referencia Keycloak;
- renderização do bloco autenticado e comprovação do `proxy_pass` esperado.

## Testes adicionados

`frontend/scripts/test-runtime-nginx-auth.sh` cobre:

- `APP_AUTH_ENABLED=false` gera `authEnabled: false` e nenhum upstream Keycloak;
- `APP_AUTH_ENABLED=true` gera `authEnabled: true` e a rota `/auth/`;
- valor inválido é recusado;
- a configuração Nginx base não pode reintroduzir Keycloak incondicional.

O Required CI executa ainda `nginx:1.27-alpine` nos dois modos. No modo autenticado, um host sintético
`keycloak` é fornecido somente para validar a sintaxe. O workflow Windows de contratos de startup também
executa o teste de renderização.

## Escopo preservado

Não foram alterados:

- Compose ou política de omissão do Keycloak em `dev`;
- backend, worker ou contratos HTTP;
- banco, volumes, migrations ou dados;
- dependências ou lockfiles;
- providers externos.

## Prova após integração

```powershell
git switch main
git pull --ff-only
.\START_CONTABILIDADE.bat build
.\START_CONTABILIDADE.bat start
```

A imagem frontend precisa ser reconstruída porque `nginx.conf` e o entrypoint fazem parte dela. A saída
esperada não contém `host not found in upstream "keycloak"`; `http://localhost:8088/healthz` e
`http://localhost:8088` devem permanecer disponíveis.

A prova autoritativa final continua sendo Windows + Docker Desktop no SHA integrado.
