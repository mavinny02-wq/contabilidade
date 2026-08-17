# Runbook — SLOs e alertas

**Classificação:** `ACTIVE_OPERATIONAL_RUNBOOK`

Alertas são sinais técnicos. Eles não afirmam regularidade ou irregularidade fiscal, não acionam
providers, não reiniciam serviços e não alteram execuções. Confirme duração e tendência antes de
agir; nunca inclua CNPJ, documento, usuário ou payload fiscal em evidências.

## Procedimento comum

1. Confirme a expressão, janela e `for` na regra versionada.
2. Compare a série com saúde do processo e logs sanitizados pelo mesmo intervalo.
3. Preserve evidências técnicas mínimas e classifique ausência de série separadamente.
4. Escale ao owner indicado no alerta. Feche somente após a série ficar abaixo do limiar durante
   uma janela completa e a causa/ação estar registrada.

<a id="http-availability"></a>
## Disponibilidade HTTP

- **Sintoma/impacto:** aumento de respostas sem sucesso; chamadas técnicas podem estar indisponíveis.
- **Triagem/ação segura:** confira readiness, taxa por `result` e dependências; reduza tráfego apenas
  pelo procedimento operacional aprovado. Escale ao backend; feche após recuperação sustentada.

<a id="http-latency"></a>
## Latência HTTP

- **Sintoma/impacto:** p99 elevado; clientes podem expirar antes da resposta.
- **Triagem/ação segura:** correlacione CPU, banco e volume sem identificar clientes. Escale ao
  backend; não reinicie automaticamente. Feche após p99 normal por uma janela.

<a id="http-5xx"></a>
## Erros HTTP 5xx

- **Sintoma/impacto:** falhas internas; o resultado fiscal permanece desconhecido.
- **Triagem/ação segura:** identifique `error_class`, versão e dependência afetada em logs
  sanitizados. Escale ao backend; feche após cessarem os erros pela janela.

<a id="queue-depth"></a>
## Profundidade da fila

- **Sintoma/impacto:** backlog técnico e aumento de espera.
- **Triagem/ação segura:** confirme workers saudáveis e taxa de entrada/saída; não conclua, cancele
  ou refile itens automaticamente. Escale ao backend/operações e feche após drenagem sustentada.

<a id="expired-leases"></a>
## Leases expirados

- **Sintoma/impacto:** trabalho perdeu posse e pode exigir recuperação técnica.
- **Triagem/ação segura:** confirme heartbeat e duração das operações, sem reutilizar lease nem
  fabricar sucesso. Escale ao backend; feche quando novas expirações cessarem pela janela.

<a id="worker-heartbeat"></a>
## Heartbeat do worker

- **Sintoma/impacto:** worker atrasado ou indisponível; fila pode parar.
- **Triagem/ação segura:** verifique processo, conectividade e relógio. Não inferir resultado das
  execuções nem reiniciar automaticamente. Escale a operações e feche após heartbeat estável.

<a id="backup-age"></a>
## Idade do backup

- **Sintoma/impacto:** último backup confirmado excedeu o objetivo de recuperação.
- **Triagem/ação segura:** confira job, destino e verificação de integridade; não apague nem
  sobrescreva artefatos. Escale a operações e feche após backup verificado e métrica atualizada.

<a id="missing-data"></a>
## Ausência de dados

- **Sintoma/impacto:** o sinal não está sendo coletado; estado do serviço é desconhecido.
- **Triagem/ação segura:** valide target, scrape e configuração. Ausência não é saúde. Escale a
  operações e feche após duas coletas consecutivas válidas.
