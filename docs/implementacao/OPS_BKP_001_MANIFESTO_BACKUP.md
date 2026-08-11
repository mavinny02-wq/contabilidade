# OPS-BKP-001 — Manifesto e verificação de backup

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`

## Objetivo

Tornar cada conjunto de backup on-premise autocontido e verificável antes de transferência ou
restauração, sem abrir o banco e sem modificar documentos.

## Resultado

Os scripts PowerShell e shell agora:

1. criam dump PostgreSQL e arquivo dos documentos;
2. calculam tamanho e SHA-256 de ambos;
3. leem a versão do arquivo `VERSION`;
4. geram `manifest-<backupId>.json` com schema `1.0`;
5. verificam imediatamente o manifesto recém-gerado;
6. removem somente os arquivos parciais do backup atual em caso de falha.

Foram adicionados:

- `scripts/verify-backup.ps1`;
- `scripts/verify-backup.sh`.

Os verificadores podem usar um manifesto explícito ou selecionar o mais recente. Eles recusam:

- componente ausente;
- tamanho divergente;
- SHA-256 divergente;
- hash ou metadata inválidos;
- nomes duplicados;
- caminho absoluto ou traversal;
- ausência de PostgreSQL ou documentos.

## Segurança

- nenhum restore automático;
- nenhum acesso de escrita ao banco durante a verificação;
- nenhum arquivo de documento é extraído;
- nenhum secret ou conteúdo de `.env` entra no manifesto;
- nenhum backup anterior é removido;
- arquivos parciais do identificador atual não ficam parecendo backup concluído.

## Compatibilidade

O JSON é deliberadamente line-oriented para permitir verificação cruzada entre PowerShell e shell
sem `jq` ou Python. O shell aceita `sha256sum` e `shasum -a 256`.

## Validações ainda necessárias

- análise sintática em Windows PowerShell 5.1/PowerShell 7;
- `sh -n` em Linux;
- geração contra dados temporários não reais;
- verificação cruzada PowerShell → shell e shell → PowerShell;
- adulteração controlada de um byte para comprovar falha de SHA-256;
- cópia para outro diretório e nova verificação;
- teste de restauração periódico permanece uma operação humana separada.
