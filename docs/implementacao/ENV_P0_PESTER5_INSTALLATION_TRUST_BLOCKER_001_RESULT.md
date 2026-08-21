# ENV-P0-PESTER5-INSTALLATION-TRUST-BLOCKER-001 result

## Status

`BLOCKED_BEFORE_INSTALLATION`

## Baseline

`774d262a0c95f7d78cf91937c068075967bd9d85`

## Classificação

`ENVIRONMENT_LIMITATION`

A instalação de Pester 5+ foi autorizada somente em escopo `CurrentUser`, sem administrador, sem
alterar políticas da máquina e com parada obrigatória caso a fonte exigisse trust.

## Diagnóstico

- repositório registrado: `PSGallery`;
- fonte: `https://www.powershellgallery.com/api/v2`;
- provider: `NuGet`;
- `InstallationPolicy`: `Untrusted`;
- Pester disponível antes da tentativa: `3.4.0` em
  `C:\Program Files\WindowsPowerShell\Modules\Pester\3.4.0`;
- execution policy `CurrentUser`: `RemoteSigned`;
- machine e user policy: `Undefined`.

## Decisão fail-closed

`Install-Module` não foi executado porque a Gallery exigiria confirmação/trust fora da autoridade
concedida. Não foram usados `-Force`, `Set-PSRepository`, mudança de `ExecutionPolicy`, elevação,
admin ou instalação alternativa.

Consequentemente, o runner e o check não foram repetidos: a evidência do mesmo SHA permanece válida
e o prerequisite não mudou. O blocker anterior continua exato:

```text
[ENVIRONMENT_LIMITATION] Pester 5+ e obrigatorio; encontrado 3.4.0.
```

## Menor próximo passo externo

O usuário precisa autorizar explicitamente uma destas opções:

1. confiar em `PSGallery` para o usuário atual; ou
2. autorizar uma instalação pontual proveniente da `PSGallery` sem alterar a política persistente do
   repositório.

Depois dessa decisão, instalar Pester 5+ em `CurrentUser`, confirmar a versão realmente importada no
Windows PowerShell 5.1 e repetir primeiro o runner sem flags Docker. Docker Desktop não foi instalado
nem chamado.

Nenhuma chamada LLM, push ou deploy foi realizada.
