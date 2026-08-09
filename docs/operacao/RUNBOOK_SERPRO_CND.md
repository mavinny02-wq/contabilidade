# Runbook — Serpro Consulta CND

## Pré-requisitos

- contrato Consulta CND ativo no nome do cliente;
- Consumer Key e Consumer Secret;
- custo unitário vigente conhecido;
- worker v0.5.0;
- migration V7 aplicada;
- provider `MANUAL` mantido como contingência.

## Configuração

No `.env`:

```text
SERPRO_CND_CONSUMER_KEY=...
SERPRO_CND_CONSUMER_SECRET=...
SERPRO_CND_REQUEST_TAG=CONTABILIDADE
```

Não envie o `.env` ao Git.

Na tela **Administração → Integrações**:

1. abra `SERPRO`;
2. informe o custo estimado por chamada conforme o contrato vigente;
3. confirme moeda `BRL`;
4. habilite o provider;
5. mantenha timeout de pelo menos 120 segundos;
6. salve.

Na política `CERTIDAO_FEDERAL_RFB_PGFN`, escolha uma das estratégias:

```text
SERPRO como primeiro provider
```

ou:

```text
FEDERAL_PORTAL → SERPRO → MANUAL
```

No segundo caso, habilite explicitamente o fallback pago e configure custo máximo.

## Preflight

```powershell
.\scripts\validar-serpro.ps1
```

Depois de configurar as credenciais:

```powershell
.\scripts\validar-serpro.ps1 -ExigirCredenciais
```

O preflight não realiza consulta e não gera cobrança.

## Primeira consulta

1. use um CNPJ autorizado;
2. solicite apenas a certidão Federal;
3. acompanhe **Execuções**;
4. confira provider `SERPRO`;
5. valide PDF, CNPJ, código de controle, emissão, validade e tipo;
6. compare a estimativa de custo com o número de chamadas bilhetáveis;
7. preserve a execução como evidência.

## Falhas principais

| Código | Ação |
|---|---|
| `SERPRO_CREDENCIAIS_NAO_CONFIGURADAS` | configurar secrets e reiniciar worker |
| `SERPRO_CREDENCIAIS_REJEITADAS` | revisar contrato/key/secret |
| `SERPRO_PROCESSAMENTO_TIMEOUT` | revisar timeout e disponibilidade |
| `SERPRO_BASE_APOIO_INDISPONIVEL` | aguardar retry/fallback |
| `SERPRO_DOCUMENTO_NAO_ARMAZENADO` | revisar storage antes de repetir chamada paga |
| `SERPRO_PDF_INVALIDO` | desabilitar provider e preservar resposta técnica |
| `SERPRO_CNPJ_CERTIDAO_DIVERGENTE` | não aceitar documento; investigar imediatamente |

## Desativação rápida

1. desabilite `SERPRO` na Administração;
2. restaure `FEDERAL_PORTAL` ou `MANUAL` na política;
3. não apague execuções, custo, documento ou auditoria;
4. registre a causa.
