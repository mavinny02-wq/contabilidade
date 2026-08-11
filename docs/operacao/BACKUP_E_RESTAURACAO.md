# Backup e restauração

## Backup

Execute um dos scripts na raiz do projeto:

```powershell
.\scripts\backup.ps1
```

```sh
./scripts/backup.sh
```

Cada execução gera um conjunto identificado por `yyyyMMdd-HHmmss` em `dados/backups`:

- `contabilidade-<id>.dump` — dump PostgreSQL no formato custom do `pg_dump`;
- `documentos-<id>.tar.gz` — arquivo compactado do storage documental;
- `manifest-<id>.json` — manifesto verificável do conjunto.

Se qualquer etapa falhar, os arquivos parciais desse identificador são removidos. Backups concluídos
anteriormente não são modificados.

## Manifesto

O manifesto usa `schemaVersion` `1.0` e registra:

- identificador do backup;
- timestamp UTC;
- versão da aplicação lida de `VERSION`;
- componentes `postgresql` e `documents`;
- nome relativo do arquivo;
- formato;
- tamanho exato em bytes;
- SHA-256.

Não são registrados secrets, conteúdo de `.env`, senha do banco, nomes internos de clientes ou dados
dos documentos.

## Verificação sem restauração

A verificação recalcula tamanho e SHA-256 dos componentes, valida os campos obrigatórios e rejeita
caminhos absolutos, traversal, nomes duplicados, arquivos ausentes e hashes inválidos. Ela não abre o
banco, não extrai documentos e não altera dados.

### PowerShell

Verificar o backup mais recente:

```powershell
.\scripts\verify-backup.ps1
```

Verificar um manifesto específico:

```powershell
.\scripts\verify-backup.ps1 `
  -ManifestPath ".\dados\backups\manifest-20260811-010203.json"
```

### Linux/Unix

Verificar o backup mais recente:

```sh
./scripts/verify-backup.sh
```

Verificar um manifesto específico:

```sh
./scripts/verify-backup.sh dados/backups/manifest-20260811-010203.json
```

A verificação shell não depende de `jq` ou Python. Ela usa `sha256sum` ou, como fallback, `shasum -a
256`.

## Transferência e retenção

Sempre transfira os três arquivos do mesmo identificador. Depois da cópia para outra mídia ou
servidor, execute novamente o verificador no destino. Não considere a cópia válida quando apenas o
dump ou apenas o arquivo de documentos estiver presente.

## Regra 3-2-1 mínima

- cópia operacional no servidor;
- cópia em mídia/servidor diferente;
- uma cópia externa, offline ou imutável;
- criptografia;
- teste de restauração periódico.

O manifesto comprova integridade do arquivo, mas não substitui criptografia, retenção, isolamento de
acesso ou teste real de restauração.

## Restauração

A restauração é deliberadamente manual nesta baseline:

1. verificar o manifesto antes de qualquer alteração;
2. desligar backend/worker;
3. preservar estado atual;
4. restaurar dump em banco limpo;
5. restaurar documentos;
6. validar Flyway;
7. iniciar serviços;
8. validar empresas/documentos/downloads;
9. registrar evidência.

Nunca restaure por cima de produção sem janela e backup imediatamente anterior. Os scripts de
verificação não executam restauração automática.
