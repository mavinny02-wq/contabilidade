# Auditoria de gaps — Produto, plataforma e infraestrutura

**Classificação:** `CANONICAL_ACTIVE_GAP_AUDIT`  
**Snapshot:** `2026-08-16`  
**Baseline funcional revisada:** `8c74acd40882579737f1dcc1ca74643beabfefec`  
**Escopo:** repositório, documentação, operação on-premise, segurança, dados, experiência, integrações
e benchmark público.

## Resultado executivo

O Contabilidade possui uma fundação acima da média para um produto ainda inicial: domínio de
empresas/documentos/certidões, execução governada, worker assistido, evidências, segurança de
engenharia e testes controlados. O principal gap não é “mais telas”; é a ausência de um backbone
operacional para gerir a carteira ponta a ponta.

```text
EPICS: 12
CAPABILITIES_ASSESSED: 45
CANDIDATE_TASKS: 93
P0: 30
P1: 28
PENDING_DECISIONS: 15
ACTIVE_WAVE_CREATED_BY_THIS_AUDIT: NO
```

## Lacunas de maior impacto

1. **Fiscal Core:** catálogo de obrigações, competência, workflow, evidência e remediação.
2. **Risco de carteira:** achados normalizados, priorização e score explicável.
3. **Onboarding:** checklist, prontidão, certificados/procurações e qualidade cadastral.
4. **Evidence Platform:** solicitação, intake, antimalware, extração, revisão e lifecycle.
5. **Integration Platform:** outbox, eventos, webhooks, service accounts, SDK e resiliência.
6. **Financeiro interoperável:** importação, normalização, conciliação e fechamento.
7. **Privacidade/segurança operacional:** LGPD, threat model, KMS, TLS e criptografia.
8. **Confiabilidade:** DR/restore, SLO, alertas, logs centralizados e capacity.
9. **Colaboração:** tarefas, SLA, canais e atendimento; portal somente após decisão.
10. **Dados/IA:** data quality e lineage antes de score/IA.

## O que já existe e deve ser preservado

- monólito modular;
- PostgreSQL/Flyway;
- estado fiscal separado de falha técnica;
- adapters e providers substituíveis;
- intervenção humana;
- evidência e auditoria;
- on-premise first;
- no bypass de CAPTCHA;
- IA não autoritativa;
- waves com owners independentes e evidência reutilizável.

## O que não deve ser construído automaticamente

- core bancário ou custódia;
- Pix/boleto próprios;
- folha completa;
- ledger completo por partidas dobradas;
- plataforma societária nacional;
- motor NFS-e municipal universal;
- SaaS/multi-tenant/white-label;
- decisão ou transmissão fiscal autônoma por IA.

Esses itens exigem decisão explícita e, na maioria dos casos, adapter/partner.

## Lacunas de infraestrutura confirmadas

- branch protection/ruleset ainda desabilitado;
- Required CI sem run remota observável;
- Windows dev e segundo startup sem evidência;
- on-premise/Keycloak sem prova final;
- TLS/DNS/PKI não definidos;
- secret manager/KMS ausente;
- storage remoto/criptografado não decidido;
- restore rehearsal e RPO/RTO pendentes;
- logs/alertas/SLO de produção incompletos;
- HA/capacity sem SLO aprovado;
- política de egress e homologação real de providers pendente.

## Método de priorização

Prioridade considera risco regulatório/segurança, capacidade desbloqueada, valor operacional,
dependência externa, reversibilidade e disponibilidade de evidência. Horizontes H0–H5 são gates de
maturidade, não datas.

## Autoridades derivadas

- [Benchmark](../benchmark/BENCHMARK_VERI_CONTABILIZEI.md)
- [Mapa de capacidades](../produto/MAPA_CAPACIDADES_CONTABILIDADE.md)
- [Backlog](../roadmap/BACKLOG_PRODUTO_PLATAFORMA.md)
- [Catálogo de tasks](../roadmap/CATALOGO_TASKS_PRODUTO_PLATAFORMA.md)
- [Roadmap](../roadmap/ROADMAP_PRODUTO_PLATAFORMA.md)
- [Decisões pendentes](../decisoes/DECISOES_PRODUTO_PENDENTES.md)
- [Arquitetura alvo](../arquitetura/ARQUITETURA_ALVO_EVOLUTIVA.md)

## Limitações

O benchmark representa posicionamento público, não arquitetura interna nem promessa de cobertura.
Providers reais, contratos, APIs, custos e requisitos legais precisam ser confirmados antes de
implementação. Esta auditoria não substitui validação com usuários e stakeholders.
