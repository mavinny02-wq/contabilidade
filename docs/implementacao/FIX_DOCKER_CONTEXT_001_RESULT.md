# FIX-DOCKER-CONTEXT-001 — preservar o contexto Docker ativo

**Status:** `PASS_STRUCTURAL_WINDOWS_RUNTIME_PENDING`  
**Owner:** startup local, helper Docker, testes e guard  
**Migration:** `NONE`  
**Supersede parcial:** `FIX-BUILDKIT-DNS-002`

## Sintoma observado

Depois da correção DNS anterior, o startup parou antes do preflight das imagens:

```text
ERROR: run `docker context use default` to switch to default context
Nao foi possivel selecionar o builder default do Docker Desktop.
```

## Causa raiz

O Docker Desktop do usuário já estava em um contexto válido diferente de `default`, normalmente
`desktop-linux`. O projeto executou desnecessariamente:

```text
docker buildx use default
```

e também definiu:

```text
BUILDX_BUILDER=default
```

O builder `default` pertence ao contexto `default`; portanto o Docker recusou a seleção enquanto
outro contexto estava ativo. Essa seleção não existe no launcher local canônico do PRIMA, que chama
`docker build` e respeita o contexto já selecionado pelo usuário.

## Correção

O startup agora:

- consulta apenas `docker context show`;
- registra o nome do contexto ativo;
- não executa `docker context use`;
- não executa `docker buildx use`;
- não define `BUILDX_BUILDER`;
- não troca automaticamente para `default` ou `desktop-linux`;
- deixa `docker image inspect`, `docker pull`, `docker build` e o diagnóstico operarem no contexto
  já ativo;
- preserva o contrato de DNS/proxy no Docker Desktop/daemon;
- preserva `--pull=false --network=none` nos Dockerfiles runtime-only;
- mantém somente a repetição focada para assinatura conhecida de snapshot.

Nenhum contexto global, builder global, volume, container, imagem da aplicação, banco, documento ou
backup é alterado.

## Regressão automatizada

O teste focado simula explicitamente:

```text
contexto ativo = desktop-linux
```

e exige que:

- o contexto seja retornado sem alteração;
- não exista chamada `docker context use`;
- não exista chamada `docker buildx use`.

O guard estrutural também rejeita futuras reintroduções de:

```text
$env:BUILDX_BUILDER = ...
docker buildx use ...
docker context use ...
```

## Validação

- parser Node do guard — `PASS`;
- teste estrutural do fluxo `desktop-linux` — `PASS`;
- busca por troca de contexto/builder executável — `PASS`;
- nenhuma migration, dependência, Compose ou código funcional alterado.

## Prova Windows pendente

```powershell
git switch main
git pull --ff-only
.\START_CONTABILIDADE.bat dev
```

A abertura esperada é:

```text
[OK] Docker daemon disponivel.
[OK] Contexto Docker ativo preservado: desktop-linux.
```

O nome pode ser diferente; ele deve ser o mesmo retornado por:

```powershell
docker context show
```
