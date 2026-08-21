# ENV-P0-PESTER5-NUGET-PROVIDER-BLOCKER-001 result

## Status

`BLOCKED_BEFORE_PESTER_INSTALLATION`

## Baseline

`abd614cdfccd61b37e91c900eea58725f684305e`

## Classificação

`ENVIRONMENT_LIMITATION`

Foi autorizada uma instalação pontual de Pester 5+ em `CurrentUser`, pela `PSGallery` oficial, com
supressão somente do prompt de fonte não confiável e sem `SkipPublisherCheck`.

## Resultado da tentativa

A resolução read-only de `Pester` pela Gallery falhou antes do download porque o Windows PowerShell
possui `PowerShellGet 1.0.0.1`, mas não possui o provider NuGet mínimo exigido. A tentativa de
bootstrap automático abriu confirmação em sessão não interativa e terminou com:

```text
CouldNotInstallNuGetProvider
O provedor de NuGet e necessario para interagir com repositorios baseados em NuGet.
Certifique-se de que '2.8.5.201' ou uma versao mais recente esteja instalada.
```

O erro precedente foi `ShouldContinue` com `NullReferenceException`, causado pelo prompt impossível
na sessão não interativa.

## Estado comprovado depois da falha

- providers disponíveis: `msi`, `msu`, `PowerShellGet 1.0.0.1` e `Programs`;
- provider `NuGet`: ausente;
- Pester disponível: somente `3.4.0` em `Program Files`;
- `PSGallery`: continua `Untrusted`;
- nenhuma política de trust ou execution policy foi alterada;
- nenhum módulo ou provider foi instalado;
- `SkipPublisherCheck`, admin, push, deploy, Docker e LLM não foram usados.

## Decisão fail-closed

Instalar o provider NuGet é uma alteração de software separada da autorização explícita para o
módulo Pester. O fluxo foi interrompido antes de executar `Install-Module` ou repetir runner/check.
A evidência do mesmo SHA permanece reutilizável.

## Menor próximo passo externo

Autorizar explicitamente o bootstrap do provider oficial NuGet `2.8.5.201+` em `CurrentUser`, sem
admin e sem mudança de trust. Depois disso:

1. instalar Pester 5+ pontualmente pela `PSGallery` com validação de publisher preservada;
2. confirmar versão, caminho e origem em uma sessão nova do Windows PowerShell 5.1;
3. confirmar que `PSGallery` continua `Untrusted`;
4. repetir o runner sem flags Docker até o próximo blocker.
