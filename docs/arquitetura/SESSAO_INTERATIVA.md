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
backend emite ticket HMAC de curta duração com jti único
  ↓
frontend usa o ticket somente no primeiro GET /info
  ↓
worker valida assinatura e solicita consumo atômico do jti ao backend
  ↓
backend grava o jti consumido no PostgreSQL
  ↓
worker troca o ticket por grant opaco em cookie HttpOnly
  ↓
frontend recebe screencast temporário via SSE e envia comandos usando o grant
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
- ticket HMAC-SHA256 com sessão, intervenção, execução, usuário, expiração e `jti`;
- consumo atômico do `jti` em `tickets_sessao_interativa_consumidos`;
- grant aleatório mantido somente em memória pelo worker e entregue em cookie HttpOnly;
- proxy `/automation/` sem gravação do query string no access log.

Não foi adicionada dependência VNC/noVNC e nenhum vídeo é persistido.

## Anti-replay

O ticket assinado é uma credencial de troca, não uma credencial reutilizável:

1. somente `infoUrl` recebe `?ticket=...`;
2. o worker valida HMAC, formato, sessão, expiração e todos os UUIDs;
3. o backend valida novamente os vínculos com intervenção, execução, operador e expiração;
4. o `INSERT ... ON CONFLICT DO NOTHING` torna o consumo do `jti` atômico entre workers e reinícios;
5. uma segunda tentativa recebe `TICKET_REUTILIZADO`;
6. o primeiro consumo gera um grant opaco cujo valor bruto não é armazenado, apenas seu SHA-256;
7. eventos e comandos usam o cookie com `HttpOnly`, `SameSite=Strict`, escopo da sessão e `Secure`
   quando o proxy informa HTTPS;
8. grants expiram junto com o ticket e desaparecem quando o worker reinicia.

O backend remove oportunisticamente registros cujo `expira_em` já venceu. A tabela é estado de
segurança temporário, não uma trilha de auditoria funcional.

## Segurança

- a intervenção deve estar atribuída ao usuário;
- o ticket dura no máximo 30 minutos e nunca ultrapassa a expiração da intervenção;
- o worker confere assinatura, sessão e execução;
- o backend confirma sessão, intervenção, execução, usuário, estado e expiração antes do consumo;
- cada `jti` pode ser consumido uma única vez, inclusive após restart do worker;
- URLs de eventos e comandos não carregam o ticket;
- cookies de grant não são acessíveis ao JavaScript;
- URLs com ticket não são registradas pelo Nginx;
- a retomada ocorre por endpoint interno autenticado com token do worker;
- a execução recebe um novo lease sem incrementar tentativa;
- sessão expirada não produz resultado fiscal automático;
- CAPTCHA não é resolvido ou burlado pelo sistema;
- ticket bruto, grant bruto e segredo HMAC não são registrados em logs.

## Limitações

- o screencast é uma representação temporária, não um desktop remoto completo;
- clipboard do sistema operacional não é compartilhado;
- o operador deve usar o campo “Enviar texto” para colar texto longo;
- o grant é local ao worker que mantém a página Playwright, assim como a própria sessão interativa;
- se o portal alterar o comportamento do iframe/desafio, será necessária validação em runtime;
- a sessão ainda não foi validada contra um CAPTCHA real autorizado da Receita Federal.
