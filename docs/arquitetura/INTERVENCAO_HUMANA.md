# Intervenção humana

Casos previstos: CAPTCHA, MFA, login interativo, certificado, confirmação excepcional e portal
alterado.

```text
worker detecta desafio
  ↓
execução entra em espera
  ↓
notificação
  ↓
operador resolve etapa
  ↓
execução continua ou usa fallback
```

Guardar execução, empresa, tipo, operador, início, fim e resultado. Nunca guardar senha ou conteúdo
secreto digitado.
