# EMP-HIS-001 — Histórico cadastral de empresas

## Objetivo

Exibir na aba `Histórico` da Empresa 360 os eventos cadastrais da empresa e de seus estabelecimentos,
sem criar uma segunda fonte de auditoria e sem expor detalhes técnicos desnecessários.

## Escopo implementado

- endpoint `GET /api/empresas/{empresaId}/historico`;
- autorização pela permissão existente `EMPRESA_LER`;
- paginação limitada a 100 eventos por requisição;
- ordenação decrescente por data e identificador;
- inclusão dos eventos cujo recurso é a própria empresa;
- inclusão dos eventos de filiais e matriz pertencentes à empresa;
- apresentação de ação, recurso, ator, data e `correlationId`;
- aba funcional na Empresa 360;
- catálogo pt-BR para os eventos cadastrais conhecidos.

## Fonte dos dados

O histórico reutiliza `eventos_auditoria`. Não há migration nem duplicação em uma tabela paralela.
A consulta considera:

- `recurso_tipo = EMPRESA` e `recurso_id = empresaId`;
- `recurso_tipo = ESTABELECIMENTO` e `recurso_id` pertencente à empresa.

Eventos antigos já existentes aparecem automaticamente. Eventos de outros domínios não são
misturados no histórico cadastral.

## Segurança

- o endpoint não retorna `detalhes_json`;
- não amplia permissões da página global de auditoria;
- não retorna documento, payload fiscal, segredo ou token;
- não realiza chamada externa;
- nenhuma alteração de dados é feita pela consulta.

## Validação pendente

- Maven completo;
- i18n, typecheck e build do frontend;
- empresa sem eventos;
- empresa com matriz e múltiplas filiais;
- isolamento entre empresas;
- paginação e ordenação;
- usuário com `EMPRESA_LER` sem `AUDITORIA_LER`;
- confirmação de que `detalhes_json` não está presente na resposta.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
