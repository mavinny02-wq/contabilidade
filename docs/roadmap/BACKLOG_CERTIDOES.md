# Backlog Certidões

## Entregue até o pacote v0.5.0

- Centro de Certidões Federal, SEFAZ-SP e PGE-SP;
- documento, histórico, manual, scheduler e alertas;
- provider, fallback e custo;
- portais assistidos Federal/SEFAZ-SP/PGE-SP;
- provider oficial Serpro para a certidão Federal;
- acompanhamento Federal consolidado na matriz;
- estados fiscal e técnico separados;
- nenhuma fonte indisponível convertida em falso verde ou vermelho.

## Implementado após v0.5.1 — aguardando runtime

- `PERF-CRT-001`: scheduler com inicialização, agendamento e alertas processados em lotes bounded,
  cursores rotativos e transações por item; evidência em
  `docs/implementacao/PERF_CRT_001_CONSULTAS_LIMITADAS.md`;
- `EXP-CRT-001`: exportação CSV do Centro de Certidões com filtros, leitura em lotes, limite de
  linhas, proteção contra fórmula de planilha e auditoria segura; evidência em
  `docs/implementacao/EXP_CRT_001_EXPORTACAO_CSV.md`;
- `CRT-DASH-001`: dashboard gerencial bounded com distribuição por status/tipo, vencimentos e
  identificação explícita de amostra parcial; evidência em
  `docs/implementacao/CRT_DASH_001_DASHBOARD_GERENCIAL.md`;
- `CRT-BULK-001`: seleção e solicitação de até 500 acompanhamentos por lote, com deduplicação,
  idempotência e resultado por item; evidência em
  `docs/implementacao/CRT_BULK_001_SOLICITACAO_LOTE.md`;
- `CRT-CAL-001`: agenda bounded de vencimentos com período, empresa, prazo e status autoritativo;
  evidência em `docs/implementacao/CRT_CAL_001_AGENDA_VENCIMENTOS.md`.

## Provider Serpro

Resultado normalizado:

- certidão negativa → `REGULAR`;
- positiva com efeitos de negativa → `POSITIVA_COM_EFEITO_NEGATIVA`;
- não emitida/cadastral/não localizada → `INCOMPLETA` com mensagem da fonte;
- base indisponível/erro servidor → falha técnica/fallback;
- PDF e CNPJ divergentes → rejeição sem atualizar o estado fiscal.

## Pendências

- runtime dos quatro providers reais;
- amostras oficiais e anonimizadas de PDFs;
- reconciliação de custo estimado com fatura;
- testes de unidade, integração, concorrência e E2E;
- InfoSimples real.
