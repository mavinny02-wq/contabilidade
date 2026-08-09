# Board de Orquestração

## Checkpoint

- branch: `main`;
- baseline: ZIP 0.1 aguardando integração local;
- gate serial: `HIST-FND-001`;
- próxima onda oficial: não selecionada;
- testes: pendentes para task dedicada.

## Regra permanente

- exatamente 5 slots oficiais;
- todos do mesmo commit base;
- sem dependência na mesma onda;
- sem overlap de arquivos críticos;
- migrations exclusivas;
- reconciliação compartilhada serial;
- extras urgentes não contam nos cinco;
- não selecionar sucessor automaticamente.

## Prova pendente

- `BACKEND_TESTES_PENDENTES`;
- `POSTGRESQL_NATIVO_PENDENTE`;
- `FRONTEND_TESTES_FOCADOS_PENDENTES`;
- `PLAYWRIGHT_TESTES_PENDENTES`;
- `E2E_PENDENTE`;
- `BACKUP_RESTORE_PENDENTE`;
- `HARDENING_ON_PREMISE_PENDENTE`.
