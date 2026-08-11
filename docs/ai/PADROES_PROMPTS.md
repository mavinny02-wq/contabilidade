# Padrões de prompts

Templates ficam em `.contabilidade-orchestrator/templates/`.

## Cabeçalho obrigatório

Todo prompt informa:

- task;
- tipo;
- item;
- baseline;
- executor real;
- capacidades necessárias;
- caminhos próprios e excluídos;
- validação permitida;
- contrato de saída.

## Executor

Para tasks Codex deste projeto, use:

```text
EXECUTION MODE: CODEX_CLOUD_LINUX
```

Não use `LOCAL_WINDOWS` como executor de uma task Codex. Quando a prova depender do Windows, o
prompt Cloud deve criar ou revisar os artefatos de validação, e o resultado local será produzido
manualmente pelo usuário e reconciliado depois.

O prompt Cloud não deve incluir comandos `cmd.exe`, WSL, Docker Desktop, caminhos `D:\...` ou acesso
a `localhost` da máquina do usuário como se estivessem disponíveis no runner.

## Implementação

Um item, um baseline, propriedade exclusiva, sem testes e validação proporcional.

## Análise

Sem alteração de produção; cria uma evidência e atualiza um backlog.

## Decisão

Opções, consequências e recomendação. Aprovação não implica implementação automática.

## Teste Cloud

Executa apenas provas suportadas no runner Linux: builds, typecheck, testes existentes, startup
controlado, fixtures sintéticas temporárias e análise estática. Não promove resultado Cloud para
runtime local.

## Prova local manual

A task Cloud pode preparar:

- BAT;
- PowerShell;
- runbook;
- checklist;
- formato do relatório.

O usuário executa localmente. Uma task posterior reconcilia o arquivo ou commit de evidência.

## Reconciliação

Compara código integrado e documentação, atualiza status comprovado, arquiva evidência e prepara a
próxima onda sem implementar.
