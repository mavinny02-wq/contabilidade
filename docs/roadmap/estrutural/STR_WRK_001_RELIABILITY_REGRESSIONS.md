# STR-WRK-001 — regressões de confiabilidade do automation worker

## Objetivo

Cobrir de forma determinística os contratos de lease, retry, idempotência e shutdown do worker sem
abrir portal fiscal, usar credencial real ou executar ação autoritativa.

## Escopo executável

- testes de aquisição única e ausência de execução concorrente indevida;
- renovação de lease durante trabalho ativo e interrupção após término;
- expiração/recuperação sem fabricar sucesso;
- classificação de retryable versus terminal e backoff bounded;
- conclusão/cancelamento idempotentes diante de resposta repetida ou timeout;
- shutdown ocioso, durante execução, por timeout e segundo sinal;
- liberação de browser, sessão, timers, servidor e conexões;
- relógio/sleeper/clientes injetáveis quando necessário para eliminar sleeps frágeis;
- correções bounded de produção apenas quando um teste comprovar defeito;
- testes com Node 24, typecheck e build.

## Limites

- sem navegação para internet ou provider fiscal;
- sem CAPTCHA, certificado, token, empresa ou documento real;
- sem aumentar dependências salvo justificativa e licença;
- sem alterar protocolo backend/worker fora do contrato comprovadamente defeituoso;
- nenhuma migration.

## Aceite

- suíte focada é determinística e não depende de tempo real longo;
- lease é mantido somente enquanto há execução real;
- retry não duplica conclusão nem custo;
- shutdown gracioso preserva trabalho até o limite e termina com código distinto em timeout;
- recursos ficam zerados ao final;
- todos os testes, typecheck e build passam em Node suportado.
