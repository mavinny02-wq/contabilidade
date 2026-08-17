# STR-ARCH-BE-003 — boundary da busca global com Empresa

## Estado

`RELEASED_FOR_EXECUTION` pela `CONTABILIDADE_FAST_LANE_WAVE_009`.

## Problema

Após `STR-ARCH-002`, o inventário possui 600 arestas e 6 findings backend. Dois deles são
`common/search/BuscaGlobalController` importando diretamente `EmpresaService` e
`EmpresaResumoResponse`, fazendo `common` depender de uma feature.

## Objetivo

Introduzir contrato de consulta/projeção estável para a busca global, com implementação no módulo
Empresa, sem alterar endpoint, payload visível, autorização ou semântica de busca.

## Owner

- `backend/src/main/java/br/com/contabilidade/common/search/**`;
- adapter/projeção estritamente necessária em `backend/**/empresa/**`;
- testes focados;
- `scripts/architecture/baseline.json`;
- remoção somente dos dois fingerprints correspondentes do allowlist;
- `docs/implementacao/STR_ARCH_BE_003_RESULT.md`.

## Aceite

- `common/search` não importa classe interna da feature Empresa;
- resultado e ordenação permanecem equivalentes;
- permissões e limites continuam iguais;
- nenhum novo ciclo ou finding;
- findings totais caem de 6 para 4;
- sem migration, POM ou API breaking;
- testes e architecture guard verdes;
- os outros quatro findings backend permanecem inalterados.

`STR_ARCH_BE_003_RELEASED`
