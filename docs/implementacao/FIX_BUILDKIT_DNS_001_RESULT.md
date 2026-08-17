# FIX-BUILDKIT-DNS-001 — recuperação de DNS do registry no builder isolado

**ITEM:** `FIX-BUILDKIT-DNS-001`  
**Status:** `PASS_STRUCTURAL_WINDOWS_RUNTIME_PENDING`  
**Owner:** startup local, módulo Docker/Buildx, testes focados e guard estrutural  
**Migration:** `NONE`

## Sintoma reproduzido pelo usuário

O build runtime-only falhou antes de ler o restante do Dockerfile:

```text
failed to resolve source metadata for docker.io/library/eclipse-temurin:21-jre
dial tcp: lookup registry-1.docker.io on 192.168.65.7:53: no such host
```

O erro ocorreu no builder dedicado `contabilidade-runtime-builder`, que usa o driver
`docker-container`.

## Causa raiz

`--pull=false` impede pull forçado, mas não elimina a necessidade de resolver o `FROM` quando a
imagem-base ainda não existe no cache próprio do BuildKit. O driver `docker-container` mantém
daemon, cache e resolução de rede isolados do image store principal do Docker Desktop. Nesse caso,
o resolver DNS interno usado pelo container BuildKit (`192.168.65.7`) não conseguiu resolver o
Docker Hub.

O Dockerfile e o artefato Java não eram a causa da falha.

## Correção

### Preflight antes de Maven/npm

O startup agora extrai automaticamente todas as linhas `FROM` do core canônico e executa, antes dos
builds locais, um `docker buildx build` cache-only para cada imagem-base:

- `eclipse-temurin:21-jre`;
- `nginx:1.27-alpine`;
- `mcr.microsoft.com/playwright:v1.60.0-noble`.

Isso:

- falha cedo, antes de recompilar todos os componentes;
- aquece o cache do builder;
- continua funcionando sem rede quando as bases já estão no cache;
- mantém `--pull=false` e `--network=none` nos builds runtime-only.

### Recuperação automática e limitada

Quando o erro corresponde exatamente a falha DNS do BuildKit:

1. identifica o hostname e o DNS que falhou;
2. verifica se o Windows consegue resolver o hostname;
3. descobre DNS IPv4 das interfaces ativas do host, rejeitando o resolver que falhou;
4. permite override explícito por `CONTABILIDADE_BUILDKIT_DNS`;
5. gera `.docker-local/artifact-build/buildkitd.contabilidade.toml`;
6. remove somente o builder isolado do projeto;
7. recria o builder com `--buildkitd-config`;
8. repete o preflight uma única vez;
9. continua o build somente depois das imagens-base estarem disponíveis.

Não são alterados:

- DNS global do Docker Desktop;
- configuração global do Windows;
- volumes PostgreSQL;
- documentos;
- backups;
- containers da aplicação;
- imagens já carregadas no daemon;
- caches globais de outros projetos.

### Falha segura

A recuperação não inventa sucesso. Quando:

- o próprio Windows não resolve o registry;
- não existe DNS alternativo utilizável;
- o registry permanece indisponível após a recriação;

o startup encerra com exit code não zero, preserva o log e orienta verificar rede, VPN, proxy,
firewall ou definir DNS aprovados:

```bat
set CONTABILIDADE_BUILDKIT_DNS=<dns1>,<dns2>
START_CONTABILIDADE.bat dev
```

Nenhum DNS público é imposto pelo código.

## Validação

- `node --check scripts/codex/validate-docker-orchestration.mjs` — `PASS`;
- `node --test scripts/codex/validate-docker-orchestration.test.mjs` — `PASS`, 2/2;
- guard estrutural completo com os novos contratos — `PASS`;
- balanceamento estrutural de parênteses, chaves e colchetes nos três arquivos PowerShell — `PASS`;
- testes Pester adicionados para:
  - classificação do erro `192.168.65.7:53`;
  - rejeição de erro 401 como DNS;
  - DNS explícito, deduplicação e rejeição do resolver falho;
  - configuração explícita inválida;
  - TOML determinístico;
  - criação do builder com `--buildkitd-config`.

## Limitação

Este executor não possui Windows PowerShell, Pester, Docker Desktop nem daemon Docker. Portanto a
prova real do cenário do usuário permanece pendente no Windows:

```bat
git switch main
git pull --ff-only
START_CONTABILIDADE.bat dev
```

O resultado esperado é que o preflight detecte o DNS inválido, recrie apenas o builder com DNS
project-scoped e prossiga para as imagens runtime-only. Se a rede do próprio Windows estiver
indisponível, a execução deve falhar cedo com diagnóstico acionável.
