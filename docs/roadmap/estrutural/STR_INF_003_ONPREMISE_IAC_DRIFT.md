# STR-INF-003 — IaC on-premise e drift guard

**Status:** `RELEASED_FOR_EXECUTION`
**Wave:** `CONTABILIDADE_FAST_LANE_WAVE_012`
**Baseline:** `main@3850443701279e2002c527b6eb376de8abd664cf`
**Migration:** `NONE`

## Problema

O deploy on-premise possui Compose e scripts, mas ainda não existe um inventário declarativo e
determinístico dos pré-requisitos do host nem um plano que detecte drift antes de qualquer
provisionamento. Operação manual sem contrato pode divergir em portas, volumes, diretórios,
capacidade, DNS, relógio, imagem ou permissões.

## Escopo

Criar somente:

- `scripts/infrastructure/**`;
- `infra/iac/**`;
- schema/policy;
- inventário e plan offline;
- fixtures/testes;
- workflow dedicado;
- `docs/implementacao/STR_INF_003_RESULT.md`.

Compose, startup, deploy, Docker daemon, volumes, host Windows/Linux e configurações reais são
somente leitura.

## Inventário mínimo

- versão/requisitos de Docker e Compose;
- arquitetura e sistema operacional suportados;
- CPU, memória, disco e inode mínimos;
- sincronização de horário;
- DNS/TLS dependencies como IDs, sem valores sensíveis;
- redes, portas e bind esperado;
- volumes e diretórios persistentes;
- ownership/permissões esperados;
- serviços e ordem de dependência;
- imagens por componente e exigência de digest;
- backup/document storage paths como IDs lógicos;
- frontier Flyway esperado.

## Regras obrigatórias

Falhar para:

- porta duplicada ou bind inesperado;
- volume persistente ausente;
- diretório sem owner/policy;
- imagem somente por tag;
- build/Maven/npm no host on-premise;
- capacidade abaixo do mínimo;
- clock sync ausente;
- target produtivo em fixture de teste;
- comando privilegiado ou destrutivo no planner;
- divergência entre plan e Compose/manifesto de release.

O executável não pode chamar Docker, PowerShell administrativo, package manager, firewall, service
manager ou filesystem fora de diretório temporário.

## Validação

- dois plans byte-idênticos;
- fixtures de host válido, capacidade insuficiente, porta/volume/digest/drift e target inseguro;
- forbidden-command guard;
- schema/policy JSON válidos;
- workflow YAML válido;
- `git diff --check`.

## Aceite

- plan machine-readable e Markdown;
- nenhuma mutação de host;
- nenhuma credencial ou dado real;
- requisitos e gaps classificados;
- runtime real permanece campanha separada.

`STR_INF_003_RELEASED`
