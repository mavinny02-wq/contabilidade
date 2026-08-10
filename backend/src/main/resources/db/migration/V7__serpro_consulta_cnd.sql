-- Provider oficial Consulta CND do Serpro.
-- Ele permanece desabilitado até que o cliente configure suas credenciais, o custo contratual
-- e execute o preflight autorizado no ambiente apropriado.
UPDATE definicoes_provedor
   SET base_url = 'https://gateway.apiserpro.serpro.gov.br/consulta-cnd/v1/certidao',
       referencia_segredo = 'env://SERPRO_CND_CONSUMER_KEY+SERPRO_CND_CONSUMER_SECRET',
       timeout_segundos = 180,
       max_retries = 2,
       pago = TRUE,
       moeda = COALESCE(moeda, 'BRL'),
       habilitado = FALSE,
       atualizado_em = CURRENT_TIMESTAMP,
       versao = versao + 1
 WHERE codigo = 'SERPRO';

-- A Consulta CND federal consolida a pessoa jurídica na matriz quando o identificador recebido é
-- de uma filial. Mantemos somente um acompanhamento federal ativo por empresa, vinculado à matriz,
-- sem remover documentos ou histórico previamente registrados.
UPDATE certidoes_acompanhamento AS certidao
   SET ativa = FALSE,
       proxima_consulta_em = NULL,
       mensagem_fonte = COALESCE(
           certidao.mensagem_fonte,
           'Acompanhamento inativado: a certidão federal é consolidada no CNPJ da matriz.'
       ),
       atualizado_em = CURRENT_TIMESTAMP,
       versao = certidao.versao + 1
  FROM estabelecimentos AS estabelecimento
 WHERE certidao.estabelecimento_id = estabelecimento.id
   AND certidao.tipo = 'FEDERAL_RFB_PGFN'
   AND estabelecimento.matriz = FALSE
   AND certidao.ativa = TRUE;
