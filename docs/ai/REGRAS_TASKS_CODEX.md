# Regras de tasks Codex

Cada prompt declara:

- `TASK`;
- `TYPE`;
- `ITEM`;
- `BASELINE`;
- `EXECUTION MODE`;
- objetivo;
- arquivos de propriedade;
- exclusões;
- validação permitida.

## Regra de testes

Fora de task explicitamente de teste:

- não criar ou alterar testes;
- não executar Maven test, Vitest, Playwright de teste, coverage ou mutation;
- registrar prova pendente.

## Escopo

- não implementar item vizinho;
- não fazer refactor amplo;
- não introduzir dependência sem review de licença;
- não criar fonte de verdade paralela;
- não editar arquivo pertencente a outro slot;
- não selecionar sucessor automaticamente.

## Contrato de ambiente

### Executor disponível para tasks Codex

Neste projeto, as tasks Codex são executadas em:

```text
CODEX_CLOUD_LINUX
```

Portanto, prompts enviados ao Codex não podem pressupor:

- Windows;
- `D:\...` ou outro caminho da máquina do usuário;
- `cmd.exe`;
- execução de `.bat`;
- Docker Desktop;
- WSL;
- `.env` local;
- acesso ao `localhost` da máquina do usuário;
- stack persistente depois que a task termina.

O Cloud deve validar somente capacidades realmente disponíveis no runner. Quando Docker ou outra
capacidade estiver ausente, a limitação é registrada uma vez; não se executa uma sequência de
comandos sabidamente inválidos.

### Prova local Windows

```text
LOCAL_WINDOWS_MANUAL
```

é um contexto de prova humana, não um executor Codex. Quando uma evidência depender do Windows local,
o fluxo correto é:

1. o Codex Cloud cria ou corrige scripts, BATs, runbooks e checklists;
2. o usuário executa esses artefatos localmente;
3. a saída é salva no relatório canônico ou commitada no repositório;
4. uma task posterior `CODEX_CLOUD_LINUX` reconcilia a evidência produzida.

Nunca criar uma task Codex com `EXECUTION MODE: LOCAL_WINDOWS` enquanto o único executor disponível
for o Cloud. Resultado Cloud e resultado de runtime local são provas diferentes e não podem ser
reclassificados um como o outro.

Não abrir nem fazer merge de PR apenas para registrar novamente um blocker de ambiente já conhecido,
salvo quando houver correção documental necessária ou outra evidência substancial e nova.
