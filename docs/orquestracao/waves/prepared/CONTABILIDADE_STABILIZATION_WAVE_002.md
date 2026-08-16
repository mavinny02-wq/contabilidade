# Contabilidade Stabilization Wave 002

**Classificação:** `CANONICAL_PREPARED_WAVE`
**Status:** `PREPARED_NOT_RELEASED`
**Preparada contra:** `main@4c07f16a8a66abb76983c9203c8e694c748f0af0`
**Objetivo:** fechar somente as lacunas Cloud ainda comprovadamente abertas antes da campanha Windows.

## Evidência consumida

- `VAL-STAB-BACKEND-001`;
- `VAL-STAB-FRONTEND-001`;
- `VAL-STAB-WORKER-001`;
- `VAL-STAB-INFRA-CONTRACT-001`;
- `VAL-STAB-FULLSTACK-001`;
- `STR-ORQ-002`;
- `STR-RUN-001`.

O full-stack amplo não será repetido. A aplicação já demonstrou saúde, Flyway V12, heartbeat,
frontend, worker, 19 jornadas e ausência de chamadas externas. Esta wave trata apenas as lacunas
restantes.

## Gates de liberação

1. PR `#56` integrada ou encerrada;
2. PR `#57` integrada;
3. refresh de `latest main` e PR queue;
4. ausência de owner concorrente;
5. shards abaixo presentes na `main`;
6. nenhum novo delta funcional que invalide a evidência consumida.

Se um gate falhar, a wave permanece preparada e não produz launchers executáveis.

## Owners preparados

| Slot | ITEM | Tipo | Owner | Resultado |
|---:|---|---|---|---|
| 1 | `BUG-INFRA-001` | correction | guard Docker e regressão específica | falso positivo removido sem enfraquecer proibições |
| 2 | `VAL-STAB-BACKEND-PG-002` | validation | backend read-only + PostgreSQL descartável | `mvn clean verify` atual verde |
| 3 | `VAL-STAB-FRONTEND-NODE24-002` | validation | frontend read-only | suite completa em Node suportado |
| 4 | `VAL-STAB-WORKER-NODE24-PW-002` | validation | worker read-only + Chromium | suite completa em Node suportado |

## Paralelismo

- os quatro owners não compartilham arquivos de produção;
- cada task escreve somente seu RESULT_MD, exceto `BUG-INFRA-001`, que possui owner exclusivo do guard;
- não há dependência entre slots;
- migration owner: `NONE`;
- providers externos: `FORBIDDEN`;
- dados reais: `FORBIDDEN`.

## Resultado esperado

Após integração dos quatro resultados:

- backend verify deixa de depender de PostgreSQL ausente;
- frontend e worker ficam comprovados no runtime Node suportado;
- worker fica comprovado com Chromium correspondente;
- o contrato de infraestrutura deixa de reprovar texto descritivo;
- a próxima etapa passa a ser Windows dev com `STR-RUN-001`, não outra campanha Cloud ampla.

## Próxima onda após consumo

Estrutural, com candidatos `STR-ORQ-003`, `STR-OWN-001`, `STR-REL-001` e configuração de branch
protection/required checks. Não liberar antes de consumir esta wave e reconciliar a campanha Windows
dev quando disponível.
