# Serpro Consulta CND

**Provider:** `SERPRO`
**Operação:** `CERTIDAO_FEDERAL_RFB_PGFN`
**Modo:** `API_OFICIAL`
**Estado inicial:** desabilitado

## Objetivo

Consultar a certidão federal conjunta RFB/PGFN de pessoa jurídica por meio da API oficial Consulta
CND, sem depender de navegador ou CAPTCHA.

## Requisição

O provider envia os campos oficiais para pessoa jurídica:

```json
{
  "TipoContribuinte": 1,
  "ContribuinteConsulta": "CNPJ_COM_14_DIGITOS",
  "CodigoIdentificacao": "9001",
  "GerarCertidaoPdf": true
}
```

Quando a API retorna `Status = 7`, a chave recebida é usada somente em memória na requisição
seguinte. A chave não é persistida. O intervalo mínimo configurável é limitado a pelo menos 500 ms.

## Autenticação

Produção usa OAuth2 `client_credentials`:

- Consumer Key;
- Consumer Secret;
- endpoint de token;
- cache do bearer token;
- renovação automática após HTTP 401.

As credenciais permanecem exclusivamente no ambiente do worker. O banco guarda apenas uma referência
de segredo.

Um bearer estático só é aceito quando `SERPRO_CND_ALLOW_STATIC_BEARER=true`. Esse opt-in existe
apenas para demonstração controlada e não deve substituir Consumer Key/Secret em produção.

## Mapeamento de retorno

| Status Serpro | Resultado interno |
|---:|---|
| 1 | certidão encontrada; `REGULAR` ou `POSITIVA_COM_EFEITO_NEGATIVA` |
| 2 | certidão emitida; `REGULAR` ou `POSITIVA_COM_EFEITO_NEGATIVA` |
| 3 | `INCOMPLETA`, com orientação para Situação Fiscal |
| 4 | `INCOMPLETA`, por situação cadastral impeditiva |
| 5 | falha retryable |
| 6 | fonte indisponível |
| 7 | processamento continuado em memória |
| 8 | `INCOMPLETA`, contribuinte não localizado |
| 9–15 | erro funcional de requisição/chave |
| 99 | fonte indisponível |

A certidão negativa vira `REGULAR`. A positiva com efeitos de negativa mantém seu estado específico.
Nenhum retorno técnico é convertido em irregularidade fiscal.

## Documento

O campo base64 é aceito somente quando:

- possui base64 válido;
- respeita o limite de tamanho;
- os bytes começam com `%PDF-`;
- o CNPJ retornado pertence à mesma raiz do CNPJ consultado;
- emissão e validade são datas válidas.

O documento é enviado ao Common de documentos com origem `API_OFICIAL`.

## Matriz e filiais

A Consulta CND pode consolidar uma filial no CNPJ da matriz. Por isso, a partir da migration V7, o
Centro de Certidões mantém somente um acompanhamento federal ativo por empresa, vinculado à matriz.
Histórico e documentos antigos de filiais permanecem preservados.

## Custo

Somente chamadas HTTP 200 e 201 são consideradas bilhetáveis. O sistema conta essas chamadas e
multiplica pelo custo unitário configurado na definição do provider.

A estimativa é acumulada na mesma execução inclusive quando ocorre retry. O custo real da fatura
continua sendo a autoridade financeira.

## Segurança e logs

- Consumer Secret e bearer token nunca aparecem em logs;
- a chave de `Status = 7` não é persistida;
- `X-Request-Tag` é sanitizado e limitado a 32 caracteres;
- diagnóstico mostra apenas modo de autenticação e host;
- provider permanece desabilitado até validação autorizada.
