# Resultado — FIX_RUNTIME_IMAGE_FRONTEND_VERIFY_001

## Identificação

- **Item:** `FIX_RUNTIME_IMAGE_FRONTEND_VERIFY_001`
- **Status:** `CORRIGIDO_ESTRUTURALMENTE_WINDOWS_RUNTIME_PENDENTE`
- **Classificação:** `TEST_HARNESS_REGRESSION`
- **Baseline:** `dc321bf5d8171fd62c9d421d8ad16b792318cb9d`
- **Migration:** nenhuma

## Falha observada

As três imagens eram construídas, mas a etapa `[6/6] Verifying runtime images` recusava o frontend:

```text
[RUNTIME-IMAGE][frontend] category=DOCKER_PERMISSION_OR_API_FAILURE exit=1
```

O serviço ainda não havia sido iniciado. A falha pertencia ao comando de verificação executado em um
container efêmero, não ao processo Nginx da stack.

## Causa

O verificador havia concentrado quatro responsabilidades em uma única string enviada como argumento
para `docker.exe` pelo Windows PowerShell 5.1:

- arquivos obrigatórios;
- renderização do modo `dev`;
- renderização do modo autenticado;
- `grep` de uma diretiva completa contendo espaços e aspas aninhadas.

O trecho final era equivalente a:

```text
grep -q "proxy_pass http://keycloak:8080/auth/;" ...
```

A regra de quoting do binder nativo do Windows PowerShell 5.1 não é a regra de CMD/BAT nem a regra do
shell Linux dentro do container. A string funcionava quando executada diretamente por `/bin/sh`, mas
podia chegar alterada ao `docker run`, terminando com exit code `1` sem identificar qual subetapa havia
falhado.

A categoria também era enganosa: qualquer exit code não reconhecido pelo executor era apresentado como
`DOCKER_PERMISSION_OR_API_FAILURE`, mesmo quando o daemon havia criado o container e somente o comando
de validação interno havia retornado vermelho.

## Correção

### Cinco contratos pequenos

`scripts/verify-runtime-images.ps1` agora executa contratos independentes:

1. `backend-files`;
2. `frontend-files`;
3. `frontend-dev-config`;
4. `frontend-auth-config`;
5. `automation-worker-files`.

Nenhum comando transportado ao container contém aspas duplas aninhadas. O modo autenticado valida
separadamente os tokens `proxy_pass` e `keycloak:8080/auth/`, sem depender de uma expressão com espaços.

### Autoridade correta para `nginx -t`

A verificação pre-start renderiza os dois modos com:

```text
CONTABILIDADE_NGINX_VALIDATE=false
```

Isso não torna o Nginx opcional. `nginx -t` continua obrigatório no startup sequencial, depois de o
frontend entrar na rede Compose onde `backend`, `automation-worker` e, no modo autenticado, `keycloak`
possuem resolução válida.

O Required CI mantém uma validação separada com `nginx:1.27-alpine` e aliases sintéticos para todos os
upstreams. Assim, sintaxe e renderização continuam cobertas sem exigir que o pre-start local simule a
rede da aplicação.

### Diagnóstico

Em falha, o verificador agora:

- informa o contrato exato;
- preserva o exit code;
- classifica exit interno diferente de `125` como `RUNTIME_IMAGE_VALIDATION_FAILED`;
- mostra stdout e stderr redigidos e limitados;
- declara explicitamente que nenhum serviço foi iniciado.

### Auth desabilitada sem falso negativo

O include gerado para `APP_AUTH_ENABLED=false` não contém mais a palavra `Keycloak`, nem mesmo em
comentário. Os testes procuram `keycloak` sem diferenciar maiúsculas de minúsculas.

## Safeguards

Foi criado:

```text
scripts/tests/assert-runtime-image-verification-contract.ps1
```

O guard exige:

- exatamente cinco contratos;
- ausência de `nginx -t` no verificador pre-start;
- presença de `CONTABILIDADE_NGINX_VALIDATE=false` nas renderizações;
- ausência de padrões `grep` com aspas aninhadas;
- diagnóstico com stdout e stderr;
- categoria `RUNTIME_IMAGE_VALIDATION_FAILED`;
- `nginx -t` preservado dentro de `start-compose-sequential.ps1`;
- teste case-insensitive para referências ao Keycloak no modo desabilitado.

O workflow Windows `startup-actions.yml` executa esse guard.

## Escopo preservado

Não foram alterados:

- Compose;
- imagens-base;
- banco ou volumes;
- migrations;
- backend ou worker;
- dependências ou lockfiles;
- providers externos.

## Prova local após integração

Como o entrypoint do frontend mudou, a imagem deve ser reconstruída:

```powershell
git switch main
git pull --ff-only
.\START_CONTABILIDADE.bat build
.\START_CONTABILIDADE.bat start
```

Saída esperada da verificação:

```text
[RUNTIME-IMAGE][backend-files] category=RUNTIME_IMAGE_VERIFIED exit=0
[RUNTIME-IMAGE][frontend-files] category=RUNTIME_IMAGE_VERIFIED exit=0
[RUNTIME-IMAGE][frontend-dev-config] category=RUNTIME_IMAGE_VERIFIED exit=0
[RUNTIME-IMAGE][frontend-auth-config] category=RUNTIME_IMAGE_VERIFIED exit=0
[RUNTIME-IMAGE][automation-worker-files] category=RUNTIME_IMAGE_VERIFIED exit=0
[OK] As tres imagens runtime e os cinco contratos de conteudo foram verificados.
```

A prova final permanece Windows PowerShell 5.1 + Docker Desktop no SHA integrado.
