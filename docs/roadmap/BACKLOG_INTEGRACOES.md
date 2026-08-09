# Backlog Integrações

## Definições presentes

- `FEDERAL_PORTAL` — fluxo implementado, desabilitado;
- `SEFAZ_SP_PORTAL` — fluxo implementado, desabilitado;
- `PGE_SP_PORTAL` — fluxo implementado, desabilitado;
- `SERPRO` — definição sem client real;
- `INFOSIMPLES` — definição sem client real;
- `MANUAL` — contingência operacional.

## Regras

- providers pagos dependem de prioridade e fallback autorizados;
- custo máximo pode bloquear provider;
- portal assistido depende de intervenção permitida;
- segredo é referência, não valor;
- falha técnica não altera resultado fiscal anterior;
- provider real permanece desabilitado até validação no ambiente autorizado.

## Antes de ativar um portal

- build verde;
- worker/flow visível no preflight;
- termos e uso autorizados;
- CNPJ autorizado;
- sessão CAPTCHA validada;
- PDF real reconhecido;
- rollback para `MANUAL` disponível;
- monitoramento e runbook conhecidos.

## Próximos providers

- Serpro CND Federal;
- InfoSimples como fallback comercial opcional;
- canal oficial PGE/Prodesp se contratado;
- futuros municípios somente após discovery específico.
