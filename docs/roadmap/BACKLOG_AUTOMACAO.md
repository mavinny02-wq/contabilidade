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

## Segurança e operação após v0.5.1 — aguardando runtime

- nenhum bypass de CAPTCHA;
- nenhum segredo em diagnóstico;
- bearer estático desabilitado por padrão;
- token OAuth cacheado somente em memória;
- chave de processamento Serpro somente em memória;
- browser não é iniciado para o fluxo API Serpro;
- `SEC-AUT-001`: ticket HMAC da sessão é consumido uma única vez no backend;
- `jti` permanece bloqueado entre reinícios do worker enquanto estiver válido;
- o ticket é trocado por grant opaco em cookie HttpOnly, sem reutilização nas URLs de eventos/input;
- grant bruto e ticket bruto não são persistidos nem registrados em logs;
- `AUT-SHD-001`: `SIGTERM`/`SIGINT` interrompe novas aquisições, aguarda a execução atual e respeita
  grace period do Compose; evidência em `docs/implementacao/AUT_SHD_001_SHUTDOWN_GRACIOSO.md`.

## Pendências

- validação runtime do anti-replay em PostgreSQL/worker/frontend;
- runtime real Serpro e portais;
- múltiplos workers/limites de concorrência;
- validação runtime do shutdown gracioso;
- telemetria histórica;
- testes permanentes e E2E.
