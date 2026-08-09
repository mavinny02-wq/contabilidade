# Modelo de domínio inicial

## Empresa
`Organizacao`, `Empresa`, `Estabelecimento`, `InscricaoTributaria`, `ResponsavelInterno`.

Campos iniciais: razão social, nome fantasia, CNPJ, matriz/filial, status, CNAE quando conhecido, regime tributário quando conhecido, endereço, município/UF, IE, IM e responsável.

## Infraestrutura de negócio
`Documento`, `Evidencia`, `DefinicaoProvedor`, `PoliticaAquisicao`, `ExecucaoIntegracao`, `TentativaExecucao`, `ResultadoNormalizado`, `SolicitacaoIntervencao`.

## Futuro primeiro vertical
`TipoCertidao`, `Certidao`, `ConsultaCertidao`, `ResultadoCertidao`.

Falha de fonte != irregularidade; execução != resultado fiscal; busca != fonte de verdade.
