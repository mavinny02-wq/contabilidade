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

Antes de listar comandos, toda task deve declarar as capacidades exigidas e selecionar explicitamente
um dos executores abaixo:

- `CODEX_CLOUD_LINUX`: nunca pressupor Windows, Docker Desktop, WSL, caminho local ou stack
  persistente. Validar somente as capacidades efetivamente disponíveis no runner Cloud;
- `LOCAL_WINDOWS`: a task não deve ser enviada ao Codex Cloud e sua evidência deve ser produzida no
  executor local compatível.

Quando o executor não possuir uma capacidade exigida, registrar a limitação uma vez e não executar
dezenas de comandos sabidamente inválidos. Resultado Cloud e resultado de runtime local são provas
diferentes e não podem ser reclassificados um como o outro.

Não abrir nem fazer merge de PR apenas para registrar novamente um blocker de ambiente já conhecido,
salvo quando houver correção documental necessária ou outra evidência substancial e nova.
