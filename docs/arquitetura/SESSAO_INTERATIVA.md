# Sessão interativa de automação

## Objetivo

Permitir que um operador autorizado resolva uma etapa humana — inicialmente CAPTCHA — dentro da
mesma página e do mesmo contexto Playwright usados pela execução.

## Fluxo

```text
worker abre portal
  ↓
CAPTCHA detectado
  ↓
worker cria sessão interativa temporária
  ↓
backend cria intervenção
  ↓
operador assume a intervenção
  ↓
backend emite ticket HMAC de curta duração
  ↓
frontend recebe screencast temporário via SSE
  ↓
operador envia mouse/teclado ao worker
  ↓
operador escolhe “Continuar automação”
  ↓
backend resolve a intervenção e renova o lease
  ↓
fluxo continua na mesma página
```

## Tecnologia

A sessão usa o Chrome DevTools Protocol:

- `Page.startScreencast` para quadros JPEG temporários;
- Server-Sent Events para transmissão;
- `Input.dispatchMouseEvent`, `Input.dispatchKeyEvent` e `Input.insertText` para entrada;
- ticket HMAC-SHA256 com sessão, intervenção, execução, usuário e expiração;
- proxy `/automation/` sem gravação do query string no access log.

Não foi adicionada dependência VNC/noVNC e nenhum vídeo é persistido.

## Segurança

- a intervenção deve estar atribuída ao usuário;
- o ticket dura no máximo 30 minutos e nunca ultrapassa a expiração da intervenção;
- o worker confere assinatura, sessão e execução;
- URLs com ticket não são registradas pelo Nginx;
- a retomada ocorre por endpoint interno autenticado com token do worker;
- a execução recebe um novo lease sem incrementar tentativa;
- sessão expirada não produz resultado fiscal automático;
- CAPTCHA não é resolvido ou burlado pelo sistema.

## Limitações

- o screencast é uma representação temporária, não um desktop remoto completo;
- clipboard do sistema operacional não é compartilhado;
- o operador deve usar o campo “Enviar texto” para colar texto longo;
- se o portal alterar o comportamento do iframe/desafio, será necessária validação em runtime;
- a sessão ainda não foi validada contra um CAPTCHA real autorizado da Receita Federal.
