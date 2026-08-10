UPDATE definicoes_provedor
   SET base_url = 'https://www10.fazenda.sp.gov.br/CertidaoNegativaDeb/Pages/EmissaoCertidaoNegativa.aspx',
       timeout_segundos = 180,
       max_retries = 1,
       atualizado_em = CURRENT_TIMESTAMP,
       versao = versao + 1
 WHERE codigo = 'SEFAZ_SP_PORTAL';

UPDATE definicoes_provedor
   SET base_url = 'https://www.dividaativa.pge.sp.gov.br/sc/pages/crda/emitirCrda.jsf',
       timeout_segundos = 180,
       max_retries = 1,
       atualizado_em = CURRENT_TIMESTAMP,
       versao = versao + 1
 WHERE codigo = 'PGE_SP_PORTAL';

-- A e-CRDA da PGE-SP é consultada por CNPJ base e representa a pessoa jurídica.
-- Mantemos um único acompanhamento ativo por empresa, vinculado à matriz, preservando
-- registros/históricos já criados para filiais em vez de removê-los fisicamente.
UPDATE certidoes_acompanhamento AS certidao
   SET ativa = FALSE,
       proxima_consulta_em = NULL,
       mensagem_fonte = COALESCE(
           certidao.mensagem_fonte,
           'Acompanhamento inativado: a e-CRDA da PGE-SP é consolidada no CNPJ base da matriz.'
       ),
       atualizado_em = CURRENT_TIMESTAMP,
       versao = certidao.versao + 1
  FROM estabelecimentos AS estabelecimento
 WHERE certidao.estabelecimento_id = estabelecimento.id
   AND certidao.tipo = 'SP_PGE_DIVIDA_ATIVA'
   AND estabelecimento.matriz = FALSE
   AND certidao.ativa = TRUE;

-- Os providers permanecem desabilitados. A ativação deve ocorrer somente depois de
-- build local, preflight técnico e uma consulta autorizada em cada portal.
