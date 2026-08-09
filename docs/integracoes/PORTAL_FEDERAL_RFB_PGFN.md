# Portal Federal RFB/PGFN

**Operação:** `CERTIDAO_FEDERAL_RFB_PGFN`
**Provider:** `FEDERAL_PORTAL`
**Modo:** `PORTAL_ASSISTIDO`

## Canal

A implementação utiliza o portal público de Certidões da Receita Federal para pessoa jurídica:

```text
https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cnpj
```

O endereço base permanece configurável por ambiente.

## Comportamento implementado

- abre a rota de pessoa jurídica;
- localiza semanticamente o campo CNPJ;
- preenche o identificador;
- detecta hCaptcha, reCAPTCHA, Turnstile e textos equivalentes;
- cria sessão interativa quando a política permite;
- retoma na mesma página após o operador continuar;
- aciona emissão;
- captura somente bytes de PDF fornecidos pelo portal via download, resposta HTTP, popup/blob ou link;
- valida assinatura `%PDF-`;
- não transforma uma página HTML impressa pelo navegador em certidão oficial;
- extrai texto do PDF;
- classifica CND, CPEND, positiva ou resultado incompleto;
- extrai CNPJ, emissão, validade e código de controle quando presentes;
- rejeita documento cujo CNPJ diverge da consulta;
- envia o documento ao backend;
- retorna resultado normalizado ao Centro de Certidões;
- classifica indisponibilidade, timeout e alteração de portal separadamente.

## Segurança e limites

- nenhuma técnica de ocultação de automação foi adicionada;
- CAPTCHA não é burlado;
- o operador recebe a instrução para resolver somente o desafio, sem clicar em “Emitir”;
- o PDF é removido do diretório temporário após o envio;
- o texto extraído não é enviado ao frontend nem persistido no resultado;
- o provider inicia desabilitado;
- ativação exige validação autorizada com CNPJ e portal reais.

## Ativação

1. iniciar backend, frontend e worker;
2. acessar **Administração → Integrações**;
3. habilitar `FEDERAL_PORTAL`;
4. confirmar que a política `CERTIDAO_FEDERAL_RFB_PGFN` mantém esse provider em primeiro lugar;
5. solicitar uma certidão em ambiente autorizado;
6. acompanhar logs, execução, intervenção e documento;
7. desabilitar imediatamente se o portal apresentar mudança não reconhecida.

## Critérios ainda pendentes

- validação real dos seletores da versão atual do portal;
- validação real do iframe CAPTCHA no screencast;
- confirmação do mecanismo de download atual;
- amostras autorizadas de CND e CPEND para conferir o parser;
- comportamento com mensagem de informações insuficientes;
- medição de timeout, taxa de sucesso e limites do portal.
