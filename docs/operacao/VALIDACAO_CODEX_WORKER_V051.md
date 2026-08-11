# Validação do automation worker 0.5.1 no Codex Cloud Linux

## Escopo e classificação

- Item: `VAL-CLOUD-WRK-V051-001` (slot 3/5).
- Versão conferida em `VERSION`: `0.5.1`.
- Ambiente: Codex Cloud Linux, sem Docker, WSL, caminhos Windows ou acesso ao localhost do usuário.
- Classificação final: **VERDE**.
- Chamadas a provedores externos durante a validação: **zero**. Não foram usados credenciais,
  CNPJ, documentos fiscais ou mecanismos de CAPTCHA.

## Preparação e toolchain

O comando `contabilidade-maintenance` não estava instalado no executor e terminou com código 127.
`contabilidade-prepare playwright` terminou com código 0 e instalou as dependências Linux e o
Chromium. A instalação preparada foi usada explicitamente pelo `PATH`, pois o shell já aberto
mantinha o Node anterior em cache.

| Ferramenta | Versão |
| --- | --- |
| Node.js | 24.15.0 |
| npm | 11.4.2 |
| TypeScript | 5.9.3 |
| Playwright | 1.60.0 |
| pdfjs-dist | 6.1.200 |

## Comandos e resultados

Executados em `automation-worker`, com Node 24.15.0 preparado:

| Comando | Código | Resultado |
| --- | ---: | --- |
| `npm ci --prefer-offline --no-audit --no-fund` | 0 | 50 pacotes instalados a partir do lockfile |
| `npm run typecheck` | 0 | sem erros TypeScript |
| `npm test` | 0 | 7 testes aprovados, nenhum ignorado |
| `npm run build` | 0 | artefatos emitidos em `dist` |
| `git diff --check` | 0 | sem erros de whitespace |

O aviso npm sobre a variável legada `http-proxy` pertence à configuração do executor e não alterou
o resultado.

## Regressões permanentes

Foi adotado o test runner nativo do Node, sem nova dependência. A suíte cobre:

- parsing limitado de inteiros e mínimo de 32 caracteres do segredo de assinatura;
- assinatura HMAC, expiração e claims malformados de `SessionTicket`;
- troca por cookie `HttpOnly`, `SameSite=Strict`, rotação do grant e ausência do segredo bruto;
- limite de sessões interativas e de assinantes SSE;
- liberação da capacidade depois de falha parcial ao iniciar o screencast;
- encerramento ocioso imediato e preservação de aquisição em andamento até sua conclusão;
- carregamento do PDF.js sem `DOMMatrix`, `Path2D` ou `ImageData` previamente definidos;
- extração de `DOCUMENTO FICTICIO CODEX CLOUD` de PDF sintético criado em diretório temporário;
- registro vazio, equivalente a todos os provedores reais desabilitados;
- Chromium headless, página `data:`, bloqueio de URL não local e fechamento de página, contexto e
  browser.

## Defeitos determinísticos corrigidos

1. O Chromium não iniciava como root no Linux porque o sandbox setuid não é aceito nesse modo. O
   runtime agora mantém o sandbox para usuários não-root e o desliga somente quando `getuid()` é 0.
2. O loop ocioso permanecia dormindo por todo o `POLL_INTERVAL_MS` depois de `SIGTERM`, fazendo o
   prazo gracioso expirar. A espera agora é acordada por `parar()`, sem cancelar trabalho já em voo.
3. Foi criado um contexto de diagnóstico local seguro que aborta qualquer requisição que não seja
   `data:`, `about:`, `127.0.0.1`, `localhost` ou `::1`.

## Startup controlado e health

O `dist/index.js` foi iniciado com backend intencionalmente ausente em `127.0.0.1:65534`, token e
segredo exclusivamente locais, intervalos de 60 segundos, Chromium headless e todas as credenciais
Serpro vazias, com `SERPRO_CND_ALLOW_STATIC_BEARER=false`.

- `GET http://127.0.0.1:3001/health`: HTTP **200**, corpo com `status: SAUDAVEL`.
- A recusa `ECONNREFUSED` do backend foi a falha esperada e controlada.
- `SIGTERM`: código final **0** e mensagem de loop encerrado sem interromper execução.
- Nenhum portal foi navegado e nenhum provider foi chamado.

## PDF.js e Playwright local

O teste de PDF criou e removeu um arquivo sintético em `/tmp`, importou o build legacy do PDF.js
sem globais de canvas e extraiu exatamente o texto fictício esperado. Nenhum fixture fiscal foi
persistido.

O smoke abriu Chromium headless, criou contexto e página, carregou somente uma URL `data:`, tentou
uma origem `.invalid` que foi abortada pela rota antes de rede, e fechou todos os recursos. Não
houve tráfego para Receita, SEFAZ, PGE, Serpro, InfoSimples ou qualquer outro provider.

## Pendências

- Disponibilizar `contabilidade-maintenance` na imagem do executor para que a etapa de manutenção
  possa ser executada em validações futuras. A ausência da ferramenta não afeta os resultados do
  worker descritos acima.
