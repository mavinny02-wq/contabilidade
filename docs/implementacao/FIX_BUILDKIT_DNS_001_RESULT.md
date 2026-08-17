# FIX-BUILDKIT-DNS-001 — histórico substituído

**Status:** `SUPERSEDED`  
**Substituído por:** `FIX-BUILDKIT-DNS-002`

A primeira abordagem criava um builder `docker-container` isolado, descobria DNS IPv4 das
interfaces do host, gerava `buildkitd.contabilidade.toml` e permitia
`CONTABILIDADE_BUILDKIT_DNS`.

Depois da comparação direta com a implementação canônica do PRIMA, essa estratégia foi removida.
Ela divergia da fronteira adotada lá, na qual:

- o build usa o builder `default` compartilhado com o Docker daemon;
- DNS e proxy são autoridade do Docker Desktop/daemon;
- o repositório não escolhe nem versiona resolver;
- o diagnóstico separa host, container e BuildKit sem expor configuração ou credencial.

Não use a configuração ou variável da implementação histórica. A autoridade atual é:

- `docs/implementacao/FIX_BUILDKIT_DNS_002_RESULT.md`;
- `docs/operacao/RUNBOOK_DOCKER_BUILD_NETWORK_DNS.md`.
