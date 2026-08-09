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
