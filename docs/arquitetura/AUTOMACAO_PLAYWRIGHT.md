# Automação Playwright

Worker separado responsável por sessão, navegação, timeout, download, evidência técnica, detecção de desafio humano, pausa/retomada e classificação de erro.

Não conhece regra fiscal nem decide regularidade.

Estados técnicos: `NA_FILA`, `EXECUTANDO`, `RETRY_AGENDADO`, `AGUARDANDO_HUMANO`, `AGUARDANDO_CAPTCHA`, `AGUARDANDO_AUTENTICACAO`, `SUCESSO`, `FALHA`, `FONTE_INDISPONIVEL`, `CANCELADO`.
