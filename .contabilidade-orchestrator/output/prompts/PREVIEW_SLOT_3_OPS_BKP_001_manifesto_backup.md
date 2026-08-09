# PREVIEW SLOT 3 — OPS-BKP-001

- **TASK:** criar manifesto e verificação de backup on-premise
- **TYPE:** IMPLEMENTAÇÃO OPERACIONAL
- **ITEM:** `OPS-BKP-001`
- **BASELINE:** futuro `main` após `GATE-VAL-001` verde
- **EXECUTION MODE:** CLOUD_FIRST

## Objetivo

Gerar manifesto com SHA-256, tamanho, timestamp, versão e componentes do backup; adicionar comando de
verificação sem restaurar ou modificar dados.

## Caminhos próprios

- `scripts/backup.ps1`;
- `scripts/backup.sh`;
- novos scripts de verificação sob `scripts/`;
- `docs/operacao/BACKUP_E_RESTAURACAO.md`;
- uma evidência curta.

## Excluídos

Backend, frontend, worker, migrations, Compose e providers.

## Validação permitida

Análise sintática dos scripts, execução somente contra arquivos temporários sem dados reais e
`git diff --check`. Não executar restauração real.
