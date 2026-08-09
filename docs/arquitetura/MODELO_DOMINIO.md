# Modelo de domínio

## Empresas

- `Empresa`: identidade jurídica e responsável interno;
- `Estabelecimento`: CNPJ, matriz/filial, endereço, CNAE e regime;
- `InscricaoTributaria`: estadual ou municipal.

## Documentos

- metadados no PostgreSQL;
- conteúdo no storage;
- hash SHA-256;
- origem;
- emissão/validade;
- histórico preservado.

## Integrações

- `DefinicaoProvedor`;
- `ExecucaoIntegracao`;
- `SolicitacaoIntervencao`;
- resultado normalizado futuro.

## Separações obrigatórias

- empresa não é estabelecimento;
- execução não é resultado de negócio;
- documento não é regularidade;
- fonte indisponível não é irregularidade;
- busca não é fonte de verdade.
