# Intervenção humana

Casos previstos: CAPTCHA, MFA, login interativo, certificado, confirmação excepcional e portal
alterado.

```text
worker detecta desafio
  ↓
execução entra em espera
  ↓
solicitação de intervenção + notificação
  ↓
operador assume e resolve
  ↓
execução é concluída manualmente, retomada ou usa fallback
```

A API controla atribuição, expiração, resolução e auditoria.

## Limite atual

A versão 0.2.0 não transmite uma sessão de navegador viva para a UI. Quando um futuro fluxo
Playwright solicitar intervenção, o contexto atual é encerrado depois do reporte. O handoff visual e
a retomada do mesmo contexto são itens pendentes e devem ser implementados antes de um CAPTCHA real.
