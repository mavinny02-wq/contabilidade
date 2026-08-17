# FIX-BUILDKIT-DNS-002 — alinhamento exato com a fronteira DNS do PRIMA

**Status:** `PASS_STRUCTURAL_WINDOWS_RUNTIME_PENDING`  
**Owner:** startup local, Docker helper, diagnóstico, testes e guard  
**Migration:** `NONE`  
**Supersede:** `FIX-BUILDKIT-DNS-001`

## Verificação no PRIMA

A implementação canônica observada em `mavinny02-wq/euro_rail` não seleciona DNS no repositório e
não cria um builder com `buildkitd.toml`. O PRIMA:

- usa o builder/default daemon do Docker;
- distingue resolver do host, container comum e BuildKit;
- limita o diagnóstico a reachability e metadados seguros;
- orienta a configurar DNS/proxy no Docker Desktop/daemon;
- proíbe versionar DNS específico de workstation;
- mantém a falha externa como falha, sem inventar `PASS`.

A solução project-scoped integrada anteriormente no Contabilidade divergia desse contrato e foi
removida.

## Correção aplicada

- seleção explícita do builder `default` do Docker Desktop;
- `BUILDX_BUILDER=default` durante o core;
- remoção única e restrita do builder legado `contabilidade-runtime-builder`;
- remoção do TOML local obsoleto;
- imagens-base verificadas pelo image store do Docker daemon;
- `docker pull` daemon-level somente quando a imagem ainda não existe localmente;
- preservação dos builds runtime-only com `--pull=false --network=none`;
- diagnóstico seguro equivalente ao PRIMA em:
  - host Windows;
  - daemon;
  - container;
  - BuildKit;
- instrução acionável para Docker Desktop → Settings → Docker Engine;
- nenhum DNS público/corporativo codificado;
- nenhuma descoberta automática de DNS por interface;
- nenhum `--buildkitd-config`;
- nenhuma alteração automática da configuração global.

A recuperação independente de corrupção conhecida de snapshot permanece com uma única repetição,
seguindo o padrão PRIMA, e executa somente `docker builder prune --force`; não remove volumes,
containers ou dados.

## Segurança

Não são gravados no diagnóstico:

- variáveis de ambiente;
- configuração completa do Docker;
- proxy;
- usuário/senha;
- token;
- certificado;
- dado fiscal ou pessoal.

Não são removidos:

- PostgreSQL;
- documentos;
- backups;
- volumes;
- containers;
- imagens da aplicação.

## Validação estrutural

- o guard exige builder `default`, daemon pull e diagnóstico por camada;
- o guard rejeita `CONTABILIDADE_BUILDKIT_DNS`, `[dns]`, `--buildkitd-config` e descoberta de
  interfaces;
- Pester cobre seleção do default, remoção restrita do builder legado e classificação DNS;
- o validator Node continua rejeitando prune de sistema/volume e `compose down -v`;
- a prova real permanece no Windows com Docker Desktop.

## Prova pendente

```bat
git switch main
git pull --ff-only
START_CONTABILIDADE.bat dev
```

Se o daemon ainda não resolver o registry, aplicar o runbook
`docs/operacao/RUNBOOK_DOCKER_BUILD_NETWORK_DNS.md`, reiniciar o Docker Desktop e repetir.
