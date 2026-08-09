# Backlog Automação

## Entregue até v0.4.0

- worker isolado;
- polling e lease;
- heartbeat;
- browser sandbox;
- registry de fluxos;
- sessão interativa CDP/SSE;
- mouse, teclado, rolagem e texto;
- tickets HMAC temporários;
- retomada no mesmo contexto;
- upload de documento;
- fluxo Federal;
- fluxo SEFAZ-SP;
- fluxo PGE-SP;
- captura PDF por download, resposta, popup, link ou blob;
- parsers específicos por órgão;
- classificação de CAPTCHA, indisponibilidade, timeout e portal alterado.

## Segurança preservada

- nenhum bypass de CAPTCHA;
- nenhum serviço externo de resolução;
- nenhuma falsificação deliberada de browser humano;
- nenhum HTML impresso como substituto do PDF oficial;
- nenhum resultado fiscal conclusivo sem evidência exigida pelo domínio.

## Pendências

- validação runtime autorizada dos três portais;
- revisão de segurança da sessão;
- redaction de evidência técnica futura;
- limite de concorrência por múltiplos workers;
- shutdown gracioso aguardando execução;
- testes automatizados e E2E;
- telemetria histórica por portal.
