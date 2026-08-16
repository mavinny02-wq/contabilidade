# Regras de agentes — automation worker

Este arquivo especializa o contrato da raiz para `automation-worker/**`.

## Limites operacionais

- O worker Playwright é separado do backend HTTP.
- Leases, idempotência, retry, heartbeat, shutdown e intervenção humana devem permanecer explícitos.
- Nunca burle CAPTCHA, MFA ou anti-bot.
- Sessão interativa exige limites, auditoria e retomada governada.
- Não use credenciais/dados reais em build, teste ou fixture.
- Nenhuma task comum chama provider fiscal real ou pago.
- Fechamento de browser/contexto e liberação de lease devem ser seguros em erro e shutdown.

## Tipagem e contratos

- Mantenha contratos com backend versionados/estritos.
- Não transforme falha técnica em resultado fiscal.
- Logs não contêm cookies, tokens, documentos ou PII.
- Alterações de retry/concorrência exigem owner explícito e prova posterior focada.

## Validação estrutural comum

```text
cd automation-worker
npm ci --no-audit --no-fund
npm run typecheck
npm run build
```

Não execute a suíte Node/Playwright em task comum. Use task de validação explicitamente liberada.
