# STR-SEC-001 — guard local de segredos e PII

## Objetivo

Detectar antes do merge credenciais, tokens, chaves, certificados e PII insegura em arquivos
rastreados, sem enviar conteúdo do repositório a serviço externo e sem reproduzir o valor detectado
em console, artefato ou relatório.

## Escopo executável

- scanner local determinístico, preferencialmente em Python standard library;
- leitura somente de arquivos textuais rastreados pelo Git;
- regras para private keys/certificados, bearer/JWT, DSN com credencial, prefixes de tokens,
  assignments sensíveis e PII pessoal em fixtures/logs/resultados;
- diferenciação explícita entre placeholders seguros e valores reais;
- política versionada de exclusões e allowlist por fingerprint/regra, nunca pelo segredo bruto;
- resultado com arquivo, linha, regra e fingerprint irreversível;
- testes sintéticos positivos, negativos, redaction e falso-positivo;
- workflow dedicado sem upload do conteúdo detectado.

## Limites

- CNPJ empresarial isolado não é automaticamente PII, mas dados pessoais vinculados continuam
  sensíveis;
- não escanear binários, artefatos de build, dependências instaladas ou dados locais ignorados;
- não introduzir serviço SaaS ou chamada externa obrigatória;
- não gravar `.env`, token, certificado, cookie, documento ou payload fiscal no resultado;
- findings existentes devem ser classificados e corrigidos ou receber exceção com owner, motivo e
  expiração.

## Aceite

- baseline atual passa sem esconder achados reais;
- segredo sintético, chave privada, JWT e CPF sintético inseguro são detectados;
- placeholders aprovados não falham;
- logs e JSON de saída não contêm o valor sensível;
- exceção expirada falha;
- scanner e testes rodam localmente e em CI;
- zero alteração em código funcional ou dados reais.
