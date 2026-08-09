# Automação Playwright

## Baseline

O worker:

- inicia Chromium isolado;
- expõe health check;
- envia heartbeat;
- possui registro de fluxos;
- não contém fluxo real de portal.

## Regras

- nunca executar browser na thread HTTP do Spring Boot;
- sessão e download pertencem ao worker;
- CAPTCHA/MFA geram intervenção;
- alteração de selector deve ser classificada como `PORTAL_ALTERADO`;
- evidência técnica não deve expor segredo;
- fluxo de portal não decide regularidade fiscal.
