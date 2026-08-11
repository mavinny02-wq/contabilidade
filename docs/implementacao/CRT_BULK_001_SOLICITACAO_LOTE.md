# CRT-BULK-001 — Solicitação de certidões em lote

## Objetivo

Permitir que o operador selecione acompanhamentos no Centro de Certidões e solicite processamento em
lote, preservando idempotência, autorização e isolamento de falhas por item.

## Escopo implementado

- endpoint `POST /api/certidoes/solicitar-lote`;
- limite de 500 IDs por chamada;
- deduplicação mantendo a ordem recebida;
- chave de idempotência por lote e acompanhamento;
- processamento transacional por item via `CertidaoService.solicitar`;
- erro de negócio em um item não interrompe os demais;
- resultado com totais e situação individual;
- auditoria `CERTIDOES_SOLICITADAS_EM_LOTE` apenas com contagens e identificador do lote;
- seleção individual e seleção das certidões filtradas no frontend;
- resultado explícito para lote integral ou parcialmente aceito.

## Idempotência

O cliente envia uma chave por operação. O backend deriva a chave de cada acompanhamento:

```text
CERTIDAO:BULK:<chave-do-lote>:<acompanhamento-id>
```

Repetir a mesma chamada com a mesma chave não cria uma segunda execução para o mesmo item. IDs
repetidos no próprio payload são processados uma única vez.

## Isolamento de falhas

Exceções de negócio são registradas no resultado individual, incluindo situações como:

- acompanhamento inexistente ou inativo;
- política ausente ou desabilitada;
- ausência de provider permitido;
- conflito de idempotência.

Falhas inesperadas não são ocultadas e continuam produzindo erro técnico da chamada.

## Segurança

- exige `CERTIDAO_SOLICITAR`;
- não recebe CNPJ, credencial, certificado ou payload fiscal;
- não chama diretamente nenhum provider;
- apenas cria ou reutiliza execuções pela fila existente;
- a auditoria não registra a chave de idempotência nem a lista completa de IDs;
- nenhuma migration ou nova permissão.

## Validação pendente

- Maven completo;
- i18n, typecheck e build do frontend;
- lote com 1, 500 e mais de 500 IDs;
- IDs duplicados;
- mistura de itens válidos, inativos e inexistentes;
- repetição com a mesma chave de idempotência;
- seleção filtrada e limpeza de seleção;
- auditoria sem lista de IDs e sem chave bruta;
- confirmação de que nenhuma chamada externa ocorre apenas pelo endpoint.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
