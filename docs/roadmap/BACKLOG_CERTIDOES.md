# Backlog Certidões

## Baseline até v0.4.0

- Centro de Certidões Federal, SEFAZ-SP e PGE-SP;
- estados fiscal e técnico separados;
- documento, histórico, manual e scheduler;
- solicitação individual/lote;
- provider, fallback e custo;
- alertas e visão consolidada;
- portal Federal assistido;
- portal SEFAZ-SP assistido;
- portal PGE-SP assistido;
- PGE-SP consolidada na matriz/CNPJ base.

## HIST-CRT-002 — Portal Federal assistido

**Estado:** implementação concluída; runtime pendente.

## HIST-CRT-003 — Portal SEFAZ-SP assistido

**Estado:** implementação concluída; runtime pendente.

Entregue:

- CNPJ completo;
- janela operacional configurável;
- CAPTCHA humano;
- retomada;
- captura de PDF;
- parser e validação de CNPJ;
- impedimento eletrônico tratado como fallback/manual;
- upload e resultado normalizado.

Provas pendentes:

- `SEFAZ_SP_PORTAL_RUNTIME_PENDING`;
- `SEFAZ_SP_CAPTCHA_RUNTIME_PENDING`;
- `SEFAZ_SP_PDF_SAMPLE_PENDING`;
- `PLAYWRIGHT_E2E_PENDING`.

## HIST-CRT-004 — Portal PGE-SP assistido

**Estado:** implementação concluída; runtime pendente.

Entregue:

- CNPJ base;
- um acompanhamento ativo por empresa/matriz;
- CAPTCHA humano;
- retomada;
- captura de PDF;
- parser e validação de CNPJ base;
- caso com débitos tratado sem falso documento conclusivo;
- upload e resultado normalizado.

Provas pendentes:

- `PGE_SP_PORTAL_RUNTIME_PENDING`;
- `PGE_SP_CAPTCHA_RUNTIME_PENDING`;
- `PGE_SP_PDF_SAMPLE_PENDING`;
- `PGE_SP_CPEN_ADMINISTRATIVE_FLOW_PENDING`;
- `PLAYWRIGHT_E2E_PENDING`.

## Pendências gerais

- validar os três portais em runtime autorizado;
- amostras reais e anonimizadas de PDFs;
- validação oficial complementar de documento;
- bulk robusto em grande volume;
- exportação CSV;
- dashboard gerencial;
- testes de unidade, integração e E2E;
- Serpro/InfoSimples reais.
