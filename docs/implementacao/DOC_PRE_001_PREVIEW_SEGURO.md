# DOC-PRE-001 — Pré-visualização segura de documentos

## Objetivo

Permitir que PDFs, PNGs e JPEGs sejam visualizados dentro da aplicação sem enfraquecer as regras de
autorização e integridade já aplicadas ao download.

## API

```http
GET /api/documentos/{documentoId}/preview
```

- exige `DOCUMENTO_BAIXAR`;
- aceita somente documento ativo;
- suporta `application/pdf`, `image/png` e `image/jpeg`;
- recalcula tamanho e SHA-256 antes de responder;
- entrega exatamente o `Resource` que foi aprovado pela verificação.

Formatos não suportados retornam HTTP 415 e permanecem disponíveis pelo download autorizado.

## Cabeçalhos de resposta

- `Content-Disposition: inline`;
- `Cache-Control: no-store, private`;
- `X-Content-Type-Options: nosniff`;
- `Cross-Origin-Resource-Policy: same-origin`;
- CSP sandbox restritiva para o recurso inline.

## Interface

A página Documentos mostra `Visualizar` somente para formatos suportados e usuários que já possuem
`DOCUMENTO_BAIXAR`. O conteúdo é carregado em `Blob URL`, revogado ao fechar/trocar o modal e
exibido por `object` para PDF ou `img` para imagens.

O download continua disponível no rodapé do modal como contingência para navegadores sem renderer
de PDF.

## Auditoria e segurança

- evento `DOCUMENTO_PREVISUALIZADO`;
- auditoria contém empresa, MIME, tamanho e confirmação de integridade;
- não registra hash bruto, referência de storage ou conteúdo;
- nenhuma nova permissão;
- nenhum HTML, CSV, texto ou OOXML é renderizado inline;
- nenhuma migration ou integração externa.

## Provas pendentes

- Maven completo;
- i18n, typecheck e build frontend;
- PDF, PNG e JPEG íntegros;
- documento adulterado recusado antes da resposta;
- MIME não suportado retorna 415;
- usuário sem `DOCUMENTO_BAIXAR`;
- fechamento/troca do modal sem vazamento de Blob URL;
- navegador sem renderer de PDF e fallback de download;
- headers de segurança e auditoria persistida.
