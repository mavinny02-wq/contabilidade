# OPS-BKP-UI-001 — Inventário e verificação de backups

## Objetivo

Disponibilizar uma visão operacional read-only dos conjuntos gerados por `scripts/backup.ps1`, sem
permitir criação, remoção, restauração ou download de backups pela interface.

## Escopo implementado

- nova página `Backups` protegida por `CONSOLE_TECNICA_LER`;
- listagem dos manifestos mais recentes;
- leitura do schema `1.0` produzido pelo script oficial;
- conferência automática de existência e tamanho dos componentes;
- verificação explícita de SHA-256 por conjunto;
- apresentação de versão, data, componentes e tamanhos;
- motivos seguros para manifesto inválido, componente ausente e divergências;
- evento `BACKUP_VERIFICADO_UI` sem hash, path ou nome de arquivo;
- diretório montado como read-only no backend.

## Endpoints

```text
GET /api/console-tecnica/backups
GET /api/console-tecnica/backups/{backupId}/verificar
```

O primeiro endpoint apenas inventaria e confere existência/tamanho. O segundo realiza a leitura
completa dos componentes e compara o SHA-256 com o manifesto.

## Validações de segurança

- IDs aceitos apenas no formato `yyyyMMdd-HHmmss`;
- manifestos limitados em quantidade e tamanho;
- nomes de componente sem separador de diretório;
- path traversal rejeitado;
- manifesto, raiz ou componente simbólico rejeitado/ignorado;
- nomes de componente e arquivos duplicados rejeitados;
- SHA-256 e tamanho obrigatórios no manifesto;
- limite máximo configurável para hashing de componentes grandes;
- nenhum hash esperado ou encontrado é devolvido ao frontend;
- nenhum arquivo é alterado pela leitura ou verificação.

## Configuração

```text
APP_BACKUP_DIRECTORY=/data/backups
APP_BACKUP_INVENTORY_MAX_MANIFESTS=50
APP_BACKUP_MANIFEST_MAX_SIZE_BYTES=1048576
APP_BACKUP_HASH_MAX_COMPONENT_SIZE_BYTES=53687091200
```

O Compose monta `./dados/backups` em `/data/backups:ro` no backend.

## Estados apresentados

- `SAUDAVEL`: manifesto válido, componentes presentes e tamanhos coerentes;
- `DEGRADADO`: componente ausente, tamanho/hash divergente ou leitura parcial;
- `INDISPONIVEL`: manifesto inválido ou não interpretável.

`integridadeVerificada=true` somente aparece após todos os hashes do conjunto serem recalculados e
confirmados.

## Fora do escopo

- disparar backup pela UI;
- restaurar dados;
- excluir ou baixar conjuntos;
- agendamento;
- retenção automática;
- replicação externa.

## Validação pendente

- Maven completo;
- i18n, typecheck e build do frontend;
- diretório vazio e indisponível;
- manifesto válido e inválido;
- arquivo ausente e tamanho divergente;
- hash íntegro e adulterado;
- limite de tamanho do manifesto e do hashing;
- path traversal e symlink;
- confirmação de mount read-only;
- auditoria sem hashes, paths ou filenames.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
