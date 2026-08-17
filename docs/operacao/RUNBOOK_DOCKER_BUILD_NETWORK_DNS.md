# DNS da rede de build do Docker — contrato PRIMA

## Autoridade

O Contabilidade adota a mesma fronteira operacional do PRIMA:

- builds locais usam o builder `default` do Docker Desktop;
- resolução DNS e proxy pertencem ao Docker Desktop/daemon;
- o repositório não escolhe resolver, não grava `[dns]` em `buildkitd.toml` e não altera o DNS do Windows;
- valores específicos de workstation, rede corporativa ou VPN não são versionados.

## Sintomas abrangidos

```text
lookup registry-1.docker.io on 192.168.65.7:53: no such host
Unknown host repo.maven.apache.org
temporary failure in name resolution
could not resolve host
```

Essas mensagens classificam falha da rede de build/registry. Elas não provam defeito no Dockerfile,
JAR, frontend ou worker.

## Diagnóstico por camada

O startup grava um log seguro em `.docker-local/logs/DOCKER_NETWORK_*.log`, equivalente ao
diagnóstico do PRIMA:

1. resolução e HTTP no host Windows;
2. versão/metadados mínimos do Docker daemon;
3. resolução dentro de container comum;
4. resolução dentro de build BuildKit.

O diagnóstico não imprime variáveis de ambiente, configuração completa do Docker, proxy, token ou
credencial.

Execução manual:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\diagnostics\capture-docker-network-diagnostics.ps1 `
  -OutputPath .\.docker-local\logs\docker-network-manual.log
```

## Correção

Quando o host resolve e Docker container/BuildKit não resolve:

1. abra **Docker Desktop → Settings → Docker Engine**;
2. preserve o JSON existente;
3. configure a propriedade `dns` com os servidores aprovados da organização, rede local ou VPN;
4. clique em **Apply & Restart**;
5. repita `START_CONTABILIDADE.bat dev`.

Formato ilustrativo, sem valor imposto pelo projeto:

```json
{
  "dns": ["DNS_DA_REDE_OU_VPN"]
}
```

Quando a rede exige proxy, configure o proxy no Docker Desktop/daemon e mantenha credenciais fora do
repositório. Se o próprio host não resolver, corrija primeiro Windows, VPN, firewall ou rede.

## Comportamento do startup

Antes de Maven/npm, o startup:

- seleciona o builder `default`;
- remove somente o builder legado `contabilidade-runtime-builder`, quando presente;
- remove o arquivo local obsoleto `buildkitd.contabilidade.toml`;
- verifica as imagens-base no image store do daemon;
- usa `docker pull` apenas quando uma base não existe localmente;
- interrompe com o exit code original e diagnóstico quando registry/DNS continua indisponível.

Nenhum volume PostgreSQL, documento, backup, container ou imagem da aplicação é removido.

## Não fazer

- não versionar DNS público ou corporativo;
- não tentar adivinhar DNS pelas interfaces do host;
- não injetar DNS em builder project-scoped;
- não copiar proxy ou credencial para Dockerfile, Compose, log ou resultado;
- não tratar ausência de rede como sucesso.
