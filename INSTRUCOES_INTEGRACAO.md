# Integração da versão 0.4.0

## Pré-condição

O repositório deve conter a versão 0.3.0 integrada ou arquivos equivalentes. Antes de aplicar:

```powershell
Set-Location "C:\work\contabilidade"
git status
git pull --ff-only origin main
```

A árvore deve estar limpa. Não use reset/clean automático para esconder alterações locais.

## Aplicação do patch

Extraia `contabilidade-v0.4.0-patch.zip` na raiz do repositório. Em seguida:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\_patch\APLICAR_PATCH.ps1
Remove-Item .\_patch -Recurse -Force
```

## Lockfiles e validação

```powershell
.\scripts\gerar-lockfiles.ps1
.\scripts\validar.ps1
```

Se algum comando falhar, não faça commit. Preserve a saída completa.

## Subir ambiente

```powershell
.\scripts\iniciar-dev.ps1
.\scripts\status.ps1
```

## Preflight dos fluxos

```powershell
.\scripts\validar-portal-federal.ps1
.\scripts\validar-portais-sp.ps1
```

Devem aparecer:

```text
FEDERAL_PORTAL::CERTIDAO_FEDERAL_RFB_PGFN
SEFAZ_SP_PORTAL::CERTIDAO_SP_SEFAZ_NAO_INSCRITOS
PGE_SP_PORTAL::CERTIDAO_SP_PGE_DIVIDA_ATIVA
```

## Ativação

Os providers permanecem desabilitados. Ative um portal por vez somente depois do build verde:

1. mantenha `MANUAL` como contingência;
2. use CNPJ autorizado;
3. solicite uma certidão individual;
4. resolva somente o CAPTCHA;
5. confirme PDF, CNPJ, emissão, validade e número;
6. desabilite o provider se o portal divergir do fluxo esperado.

## Commit

```powershell
git status
git add .
git commit -m "feat: implementa portais estaduais assistidos v0.4.0"
git push origin main
git log -1 --oneline
```

## Rollback antes do commit

Se a árvore estava limpa antes da aplicação:

```powershell
git restore .
git clean -fd
```

Use `git clean -fd` somente depois de revisar o que será removido com `git clean -fdn`.
