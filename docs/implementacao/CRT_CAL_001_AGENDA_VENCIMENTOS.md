# CRT-CAL-001 — Agenda de vencimentos de certidões

## Objetivo

Oferecer uma visão cronológica das certidões com validade conhecida, permitindo que a equipe planeje
renovações sem executar consultas fiscais nem duplicar a regra de status no frontend.

## API

```http
GET /api/certidoes/agenda-vencimentos
    ?inicio=YYYY-MM-DD
    &fim=YYYY-MM-DD
    &empresaId=<UUID opcional>
```

- exige `CERTIDAO_LER`;
- período padrão: hoje até 90 dias;
- intervalo máximo: 366 dias;
- somente acompanhamentos ativos e com `valida_ate` preenchida;
- ordenação por validade, empresa, tipo e ID;
- limite configurável com flag `parcial` explícita.

## Regra de domínio

O status é calculado por `CertidaoAcompanhamento.statusExibicao`, a mesma regra usada no Centro de
Certidões. A API também devolve dias até o vencimento, empresa, CNPJ, tipo e documento relacionado.

## Interface

A página `/certidoes/agenda` possui:

- filtro de data inicial e final;
- filtro opcional de empresa;
- total de vencimentos e empresas no resultado;
- prazo em dias, incluindo vencido, vence hoje e vencimento futuro;
- acesso contextual ao Centro de Certidões da empresa.

## Segurança e limites

- não chama provider externo;
- não retorna conteúdo documental, segredo ou payload de execução;
- não altera acompanhamento, fila ou resultado fiscal;
- `APP_CERTIFICATE_AGENDA_MAX_ROWS` limita a quantidade detalhada;
- resultado acima do limite permanece mensurável pelo total e marcado como parcial.

## Provas pendentes

- Maven completo;
- i18n, typecheck e build frontend;
- períodos padrão, inválido, superior a 366 dias e sem resultados;
- filtro por empresa;
- status vencida/próxima/regular coerentes com o Centro;
- limite parcial;
- usuário sem `CERTIDAO_LER`.
