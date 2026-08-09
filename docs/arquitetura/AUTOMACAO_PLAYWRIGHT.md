# Automação Playwright

## Baseline 0.3

O worker:

- inicia Chromium isolado;
- expõe health check e heartbeat;
- adquire execuções por lease;
- registra o fluxo Federal RFB/PGFN;
- mantém contexto aberto durante intervenção humana;
- transmite screencast temporário via CDP/SSE;
- retoma o fluxo na mesma página;
- captura e envia PDF;
- encerra contexto e arquivos temporários ao finalizar.

## Regras

- nunca executar browser na thread HTTP do Spring Boot;
- sessão e download pertencem ao worker;
- CAPTCHA/MFA geram intervenção;
- nenhuma técnica de bypass ou ocultação anti-bot;
- alteração de selector deve ser classificada como portal alterado;
- evidência técnica não deve expor segredo;
- fluxo de portal não decide regularidade sem documento ou mensagem conclusiva;
- provider real permanece desabilitado até validação autorizada.

## Fluxos registrados

- `FEDERAL_PORTAL::CERTIDAO_FEDERAL_RFB_PGFN`.

SEFAZ-SP e PGE-SP permanecem pendentes.
