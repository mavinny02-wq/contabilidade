# Fluxo de trabalho Codex

## Fluxo padrão Cloud

```text
baseline integrado
  ↓
reconciliação documental
  ↓
seleção de item
  ↓
prompt bounded — CODEX_CLOUD_LINUX
  ↓
PR
  ↓
review/merge pelo usuário
  ↓
reconciliação
  ↓
próxima onda segura
```

## Quando existe prova local obrigatória

O Codex Cloud não acessa a máquina Windows do usuário. Nesses casos:

```text
Codex Cloud cria/corrige script, BAT e runbook
  ↓
PR e merge
  ↓
usuário executa localmente no Windows
  ↓
saída é salva no relatório canônico ou commitada
  ↓
Codex Cloud reconcilia a evidência
  ↓
fecha gate ou registra blocker real
```

A execução `LOCAL_WINDOWS_MANUAL` é humana e não deve ser transformada em uma task Codex Cloud com
comandos `cmd.exe`, WSL, Docker Desktop ou caminhos `D:\...`.

Tipos separados:

- análise;
- decisão;
- implementação;
- bug fix;
- teste;
- reconciliação;
- ambiente.

Uma onda oficial possui exatamente cinco slots independentes.
