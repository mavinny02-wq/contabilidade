# STR-ARCH-BE-004 — boundary Certidão ↔ Empresa

**Prioridade:** `P1`
**Status:** `RELEASED_FOR_EXECUTION`
**Baseline arquitetural:** 600 arestas e 4 findings permitidos
**Migration:** `NONE`

## Problema

Três findings restantes mostram serviços de Certidão importando diretamente repositories internos
da feature Empresa:

- `CertidaoService → EmpresaRepository`;
- `CertidaoService → EstabelecimentoRepository`;
- `CertidaoSchedulerBatchService → EmpresaRepository`.

Isso torna a persistência de Empresa uma API implícita de outra feature.

## Escopo

- definir uma porta de consulta mínima para os dados de empresa/estabelecimento realmente usados;
- implementar adapter dentro da feature Empresa;
- fazer Certidão depender apenas da porta/projeção;
- preservar filtros, ordenação, autorização, paginação e semântica atual;
- adicionar testes de contrato do adapter e dos serviços;
- atualizar baseline/allowlist somente após inventário revisado.

## Critérios de aceite

1. nenhuma classe de `certidao/**` importa repository de `empresa/**`;
2. três fingerprints mapeados desaparecem;
3. inventário permanece determinístico e sem novos findings;
4. total de findings cai de `4` para `1`;
5. o único finding restante é `DocumentoService → EmpresaRepository`;
6. endpoints, DTOs e comportamento visível permanecem compatíveis;
7. compile e testes focados passam;
8. nenhuma migration, dependência ou mudança de schema.

## Fora do escopo

Corrigir o finding de Documento, redesenhar o domínio Empresa, alterar regras fiscais, executar
provider real ou juntar Certidão e Empresa no mesmo pacote.
