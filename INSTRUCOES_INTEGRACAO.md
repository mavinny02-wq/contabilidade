# Integração da versão 0.3.0

## Pré-requisito

Este patch pressupõe a versão `0.2.0` na pasta `C:\work\contabilidade`.

Antes de aplicar:

```powershell
Set-Location "C:\work\contabilidade"
git status
git pull --ff-only origin main
```

A árvore deve estar limpa.

## Aplicar o patch incremental

Extraia `contabilidade-v0.3.0-patch.zip` dentro de `C:\work\contabilidade`. O ZIP criará a pasta
`_patch`.

Depois execute:

```powershell
Set-Location "C:\work\contabilidade"
Set-ExecutionPolicy -Scope Process Bypass
.\_patch\APLICAR_PATCH.ps1
Remove-Item .\_patch -Recurse -Force
```

## Gerar lockfiles reais

O pacote não inventa `package-lock.json`. Gere-os no ambiente que possui acesso ao registry:

```powershell
.\scripts\gerar-lockfiles.ps1
```

## Configurar segredos

Revise `.env` e defina valores próprios, especialmente:

```text
APP_WORKER_TOKEN
APP_AUTOMATION_SESSION_SIGNING_SECRET
POSTGRES_PASSWORD
KEYCLOAK_ADMIN_PASSWORD
```

`APP_AUTOMATION_SESSION_SIGNING_SECRET` deve possuir pelo menos 32 caracteres e precisa ser o mesmo
no backend e no worker.

## Validar build e configuração

```powershell
.\scripts\validar.ps1
```

Nenhum erro deve ser ignorado.

## Subir a stack

```powershell
.\scripts\iniciar-dev.ps1
.\scripts\status.ps1
```

Aplicação:

```text
http://localhost:8088
```

## Preflight do worker Federal

```powershell
.\scripts\validar-portal-federal.ps1
```

O resultado deve listar:

```text
FEDERAL_PORTAL::CERTIDAO_FEDERAL_RFB_PGFN
```

## Ativação controlada

`FEDERAL_PORTAL` continua desabilitado por padrão. Para validar:

1. use somente CNPJ autorizado;
2. habilite o provider em **Administração → Integrações**;
3. mantenha `MANUAL` como fallback;
4. solicite uma certidão Federal;
5. assuma a intervenção quando o CAPTCHA aparecer;
6. resolva somente o desafio no screencast;
7. clique em **Continuar automação**;
8. confirme que o PDF oficial foi armazenado;
9. compare CNPJ, emissão, validade, código de controle e resultado;
10. desabilite o provider se qualquer comportamento divergir.

## Commit

Após validação verde:

```powershell
git status
git add .
git commit -m "feat: implementa portal federal assistido e sessao interativa v0.3.0"
git push origin main
git log -1 --oneline
```

## Rollback antes do commit

```powershell
git restore .
git clean -fd
```

Use `git clean -fd` somente depois de conferir que não há arquivos locais que devam ser preservados.
