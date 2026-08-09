# Instruções de integração — v0.2.0

## Escolha do pacote

- **Full ZIP:** substitui a árvore do projeto pela versão completa.
- **Patch ZIP:** contém somente arquivos novos/alterados em relação à baseline v0.1.0.
- **Patch textual:** útil para revisão, não substitui a validação local.

## Antes de copiar

```powershell
Set-Location "C:\work\contabilidade"

git status
git pull --ff-only origin main
git log -1 --oneline
```

A árvore deve estar limpa. Crie também um backup local:

```powershell
$backup = "C:\work\contabilidade-backup-$(Get-Date -Format yyyyMMdd-HHmmss)"
Copy-Item "C:\work\contabilidade" $backup -Recurse
```

## Aplicar o Full ZIP

Extraia o conteúdo do ZIP diretamente sobre:

```text
C:\work\contabilidade
```

Permita substituir os arquivos existentes.

## Aplicar o Patch ZIP

Extraia o patch sobre a raiz do repositório. Depois execute:

```powershell
.\APLICAR_PATCH.ps1
```

O script remove apenas caminhos explicitamente listados em `ARQUIVOS_REMOVER.txt`.

## Lockfiles obrigatórios

O ambiente que gerou o pacote não conseguiu acessar o registry npm. Por isso os lockfiles não foram
inventados nem incluídos.

Em uma máquina com acesso ao registry:

```powershell
.\scripts\gerar-lockfiles.ps1
```

Confirme a criação de:

```text
frontend\package-lock.json
automation-worker\package-lock.json
```

## Validação local

```powershell
.\scripts\validar.ps1
```

Esse script:

- compila o backend sem executar testes;
- instala dependências;
- valida i18n;
- faz build do frontend;
- faz build do worker;
- valida o Docker Compose.

Depois suba o ambiente de desenvolvimento:

```powershell
.\scripts\iniciar-dev.ps1
.\scripts\status.ps1
```

Valide manualmente:

1. login/local mode;
2. cadastro de empresa;
3. cadastro de filial;
4. upload e download de documento;
5. abertura do Centro de Certidões;
6. registro manual de uma certidão com PDF;
7. histórico;
8. providers e políticas;
9. execuções;
10. Console Técnica.

## Commit

Somente depois de validação satisfatória:

```powershell
git status
git add .
git commit -m "feat: implementa common operacional e centro de certidoes v0.2.0"
git push origin main
```

## Rollback antes do commit

```powershell
git restore .
git clean -fd
```

Use `git clean -fd` apenas depois de conferir que nenhum arquivo local importante ficará perdido.

## Rollback depois do commit

Prefira criar um commit de reversão:

```powershell
git revert <SHA_DO_COMMIT_V020>
git push origin main
```

Migrations V3 e V4 são novas em relação à v0.1.0. Em banco que já as executou, rollback de código não
remove o schema; use restauração de backup ou migration corretiva.
