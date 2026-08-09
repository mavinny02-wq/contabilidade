# Portal PGE-SP — e-CRDA da dívida ativa

**Operação:** `CERTIDAO_SP_PGE_DIVIDA_ATIVA`
**Provider:** `PGE_SP_PORTAL`
**Status:** implementação preparada; runtime autorizado pendente.

## Fonte oficial

- Emissão: `https://www.dividaativa.pge.sp.gov.br/sc/pages/crda/emitirCrda.jsf`
- Serviço estadual: `https://servicos.sp.gov.br/fcarta/7ca79371-db2f-4d94-92a3-55a2a3c1c5f2`

A emissão pública usa CPF ou CNPJ. Para pessoa jurídica, o fluxo oficial menciona CNPJ base. Por isso,
o domínio mantém um único acompanhamento ativo da PGE-SP por empresa, vinculado à matriz, e o
worker envia os oito primeiros dígitos do CNPJ.

## Fluxo implementado

1. abrir o portal de emissão da e-CRDA;
2. selecionar pessoa jurídica/CNPJ quando necessário;
3. preencher CNPJ base;
4. detectar CAPTCHA;
5. pausar em sessão interativa quando permitido;
6. emitir a certidão negativa;
7. capturar exclusivamente bytes PDF;
8. validar emissor e CNPJ base;
9. extrair resultado, número, emissão e validade quando presentes;
10. armazenar o documento e normalizar o resultado.

## Débitos existentes e CPEN

Quando o portal informa débitos e não emite a certidão negativa, a execução não produz um falso
resultado conclusivo. O procedimento de certidão positiva com efeitos de negativa é tratado como
fluxo administrativo separado e continua manual nesta versão.

## Limites

- seletores e mensagens ainda precisam de validação no portal real;
- não há bypass de CAPTCHA;
- a validade só é derivada quando o próprio PDF informa expressamente a duração;
- provider permanece desabilitado até preflight e consulta autorizada.
