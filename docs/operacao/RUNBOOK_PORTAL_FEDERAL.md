# Runbook — Portal Federal

## Provider não adquire execuções

- confirmar `FEDERAL_PORTAL` habilitado;
- consultar `/flows` do worker e procurar
  `FEDERAL_PORTAL::CERTIDAO_FEDERAL_RFB_PGFN`;
- verificar heartbeat do worker;
- verificar política de aquisição;
- verificar se a execução já está terminal ou aguardando humano.

## CAPTCHA pendente

- abrir **Intervenções**;
- escolher **Resolver agora**;
- resolver somente o desafio de segurança;
- não clicar no botão de emissão do portal;
- usar **Continuar automação**;
- aguardar o Centro de Certidões ser atualizado.

## Sessão desconectada

- fechar e reabrir a intervenção para gerar novo ticket;
- confirmar que ela ainda está atribuída ao mesmo usuário;
- verificar `/automation/` no proxy;
- verificar health do worker;
- não marcar manualmente como resolvida se o browser original já foi encerrado.

## Portal alterado

O fluxo retorna erro não retryable e permite fallback conforme a política.

- desabilitar `FEDERAL_PORTAL`;
- preservar screenshot/logs sem dados secretos;
- registrar evidência;
- analisar seletores e resultado em task separada;
- usar provider manual ou API aprovada durante a correção.

## PDF incompleto

- manter o resultado `INCOMPLETA`;
- verificar documento e parser;
- não corrigir emissão/validade por inferência;
- registrar amostra anonimizada/autorizada para evolução do parser.

## Preflight local

Com a aplicação iniciada, execute:

```powershell
.\scripts\validar-portal-federal.ps1
```

O script confirma health, versão e registro do fluxo. Ele não consulta um CNPJ nem valida CAPTCHA.
