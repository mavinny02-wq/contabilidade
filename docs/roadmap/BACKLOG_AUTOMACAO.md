# Backlog Automação

## Entregue até o pacote v0.5.0

- worker isolado;
- polling, lease e heartbeat;
- registry de fluxos;
- modo `PORTAL` com browser;
- modo `API` sem browser;
- sessão interativa CDP/SSE;
- upload por arquivo ou bytes;
- portais Federal, SEFAZ-SP e PGE-SP;
- API oficial Serpro;
- diagnóstico seguro por fluxo;
- health degradado sem bloquear APIs quando o browser está indisponível.

## Segurança

- nenhum bypass de CAPTCHA;
- nenhum segredo em diagnóstico;
- bearer estático desabilitado por padrão;
- token OAuth cacheado somente em memória;
- chave de processamento Serpro somente em memória;
- browser não é iniciado para o fluxo API Serpro.

## Pendências

- runtime real Serpro e portais;
- revisão da sessão interativa;
- múltiplos workers/limites de concorrência;
- shutdown gracioso aguardando execução;
- telemetria histórica;
- testes permanentes e E2E.
