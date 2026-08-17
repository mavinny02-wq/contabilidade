# FIX-STARTUP-PREFLIGHT-001 — parser PowerShell antes do build

**Prioridade:** `P0`
**Status:** `RELEASED_FOR_EXECUTION`
**Origem:** falha Windows após concluir Maven, npm e três imagens runtime
**Migration:** `NONE`

## Problema

O startup chegou ao fim do build e só então o Windows PowerShell 5.1 encontrou uma interpolação
inválida em `start-compose-sequential.ps1`. Embora o defeito pontual tenha sido corrigido, a ordem
operacional permitia desperdiçar todo o build antes de descobrir um erro de parser.

## Escopo

Adicionar um preflight obrigatório, antes de Maven, npm e Docker build, que:

- enumere os `.ps1` e `.psm1` operacionais sob `scripts/`;
- use o parser real de `System.Management.Automation.Language.Parser`;
- apresente arquivo, linha, coluna e mensagem sem dump de ambiente;
- encerre com código não zero ao primeiro conjunto de erros;
- aceite Windows PowerShell 5.1 e PowerShell 7;
- preserve o contexto Docker ativo;
- não execute `docker context use`, `docker buildx use` ou mudança global;
- mantenha o guard estático de `$variavel:` como defesa complementar.

## Critérios de aceite

1. erro sintético de parser falha antes de qualquer invocação Maven/npm/build;
2. todos os scripts atuais passam no Windows PowerShell 5.1;
3. caminhos com espaço funcionam;
4. saída não contém segredo, `.env` ou configuração completa do Docker;
5. teste Pester/mocks prova a ordem `parse → ferramentas → build`;
6. guard Node continua rejeitando interpolação ambígua;
7. startup, Compose e dados existentes permanecem intactos;
8. nenhuma limpeza de volume, container ou banco é adicionada.

## Fora do escopo

Refatorar o startup inteiro, trocar PowerShell por outra linguagem, mudar Compose, reconstruir
imagens por política, corrigir DNS, alterar timeout ou modificar código de produto.
