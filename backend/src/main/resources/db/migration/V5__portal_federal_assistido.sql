UPDATE definicoes_provedor
   SET base_url = 'https://servicos.receitafederal.gov.br/servico/certidoes',
       timeout_segundos = 180,
       max_retries = 1,
       atualizado_em = CURRENT_TIMESTAMP,
       versao = versao + 1
 WHERE codigo = 'FEDERAL_PORTAL';

-- O provider permanece desabilitado por padrão. A ativação deve ocorrer somente após
-- validação no ambiente autorizado do cliente e configuração do worker Playwright.
