# Integração da versão 0.5.0

## Formato desta entrega

O arquivo `contabilidade-v0.5.0-incremental.zip` contém **somente arquivos adicionados ou
modificados**, preservando exatamente as pastas do projeto:

```text
automation-worker/src/...
backend/src/...
docs/...
scripts/...
```

Não existe pasta wrapper, pasta `_patch` ou script de aplicação. Basta extrair diretamente sobre a
raiz do repositório e permitir a substituição dos arquivos repetidos.

**Esta versão não exige exclusão de nenhum arquivo.**

## Pré-condição

O repositório deve estar na versão `0.4.0` e sem alterações locais não commitadas.

```powershell
Set-Location "C:\work\contabilidade"

git status
git pull --ff-only origin main
Get-Content .\VERSION
```

O último comando deve retornar:

```text
0.4.0
```

## Copiar os arquivos

Usando o Explorer, extraia o ZIP diretamente em:

```text
C:\work\contabilidade
```

Ou use PowerShell, ajustando o caminho do download:

```powershell
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\contabilidade-v0.5.0-incremental.zip" `
  -DestinationPath "C:\work\contabilidade" `
  -Force
```

Confirme:

```powershell
Get-Content .\VERSION
git status --short
```

A versão deve ser `0.5.0`.

## Lockfiles e validação

```powershell
Set-ExecutionPolicy -Scope Process Bypass

.\scripts\gerar-lockfiles.ps1
.\scripts\validar.ps1
```

Se qualquer etapa falhar, não faça commit. Preserve a saída completa.

## Subir o ambiente

```powershell
.\scripts\iniciar-dev.ps1
.\scripts\status.ps1
```

## Preflight Serpro sem consulta

```powershell
.\scripts\validar-serpro.ps1
```

Depois de configurar as credenciais no `.env` e reiniciar o worker:

```powershell
.\scripts\validar-serpro.ps1 -ExigirCredenciais
```

O preflight verifica registro, modo API, versão, host e presença de credenciais. Ele não consulta um
CNPJ e não deve gerar cobrança.

## Ativação controlada

O provider `SERPRO` permanece desabilitado após a migration V7.

Antes de habilitar:

1. confirme contrato e credenciais do cliente;
2. configure custo unitário e moeda na Administração;
3. configure a política da operação Federal;
4. mantenha `MANUAL` como contingência;
5. use um único CNPJ autorizado na primeira prova;
6. valide CND, CPEND, código de controle, emissão, validade, PDF e custo estimado;
7. preserve execução e auditoria como evidência.

## Commit

```powershell
git status

git add .
git commit -m "feat: implementa provider oficial Serpro CND v0.5.0"
git push origin main

git log -1 --oneline
```

## Rollback antes do commit

A aplicação desta versão não remove arquivos. Para desfazer apenas os arquivos rastreados:

```powershell
git restore .
```

Os seis arquivos novos podem ser removidos explicitamente:

```powershell
Remove-Item .\automation-worker\src\SerproCndFlow.ts -Force
Remove-Item .\automation-worker\src\SerproTokenProvider.ts -Force
Remove-Item .\backend\src\main\resources\db\migration\V7__serpro_consulta_cnd.sql -Force
Remove-Item .\docs\integracoes\SERPRO_CONSULTA_CND.md -Force
Remove-Item .\docs\operacao\RUNBOOK_SERPRO_CND.md -Force
Remove-Item .\scripts\validar-serpro.ps1 -Force
```

Não use `git clean -fd` sem revisar antes `git clean -nd`, pois ele pode apagar outros arquivos não
rastreados do seu ambiente.
