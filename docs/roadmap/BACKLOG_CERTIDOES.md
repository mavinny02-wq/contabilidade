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
  `docs/implementacao/PERF_CRT_001_CONSULTAS_LIMITADAS.md`.

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
- exportação CSV;
- dashboard gerencial;
- bulk de alto volume;
- testes de unidade, integração, concorrência e E2E;
- InfoSimples real.
