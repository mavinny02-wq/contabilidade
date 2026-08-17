# FIX-BUILDKIT-DNS-002 — fronteira DNS do PRIMA

**Status:** `SUPERSEDED_PARTIAL_BY_FIX_DOCKER_CONTEXT_001`  
**Owner histórico:** startup local, Docker helper, diagnóstico, testes e guard  
**Migration:** `NONE`

## Parte preservada

Permanece válida a fronteira operacional verificada no PRIMA:

- DNS e proxy pertencem ao Docker Desktop/daemon;
- o repositório não escolhe DNS da workstation;
- não existe `buildkitd.toml` com `[dns]` gerado pelo projeto;
- o diagnóstico separa host, container comum e BuildKit;
- falha externa permanece falha;
- imagens-base ausentes são obtidas pelo Docker daemon;
- builds runtime-only continuam com `--pull=false --network=none`.

## Parte superseded

A implementação original deste item interpretou incorretamente “usar o Docker padrão” como:

```text
docker buildx use default
BUILDX_BUILDER=default
```

Isso falha quando o Docker Desktop está legitimamente no contexto `desktop-linux` ou em outro
contexto ativo. O launcher local do PRIMA não troca contexto nem seleciona builder por nome; ele usa
`docker build` no contexto já selecionado pelo usuário.

A correção canônica está em:

```text
docs/implementacao/FIX_DOCKER_CONTEXT_001_RESULT.md
```

## Estado final

- nenhuma troca automática de contexto;
- nenhuma seleção automática de builder;
- nenhuma alteração global do Docker Desktop;
- nenhum DNS codificado;
- contexto ativo preservado;
- prova real Windows/Docker Desktop ainda necessária.
