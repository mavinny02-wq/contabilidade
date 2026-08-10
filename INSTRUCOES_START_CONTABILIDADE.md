# Correção do START_CONTABILIDADE

## Motivo

O BAT anterior introduziu uma expressão `for /f` para interpretar `java -version`. Essa expressão
não existe no BAT funcional do PRIMA e falhava no parser do `cmd.exe`, antes mesmo do build.

A nova implementação mantém um BAT pequeno e coloca a lógica operacional em PowerShell, onde
caminhos, argumentos e códigos de saída podem ser tratados sem os problemas de quoting do Batch.

## Arquivos obrigatórios desta correção

- `START_CONTABILIDADE.bat`
- `scripts/start-contabilidade.ps1`

Os outros três arquivos corrigem blockers TypeScript já encontrados pela análise v0.5.0.

## Aplicação

Extraia o ZIP diretamente em:

```text
D:\priv\priv\projeto\contabilidade
```

Permita sobrescrever os arquivos existentes.

## Execução

```powershell
Set-Location "D:\priv\priv\projeto\contabilidade"
.\START_CONTABILIDADE.bat dev
```

O BAT sempre volta ao `pause`, inclusive quando o PowerShell encontra erro.

## Estratégia de build

- Maven roda no Windows usando `JAVA_HOME` apontado para JDK 21.
- npm roda no Windows.
- Playwright não baixa browsers no Windows.
- Docker recebe somente JAR, `dist` e dependências JavaScript de produção.
- `docker compose down` só ocorre depois que todos os builds e imagens passaram.
- O build das imagens runtime usa `--network=none`; Maven/npm nunca são executados no Docker.

## Java

A busca prioriza:

```text
CONTABILIDADE_JAVA_HOME
C:\work\java\zulu21.44.17-ca-jdk21.0.8-win_x64
JAVA_HOME
instalações comuns de JDK 21
```

O Java 17 do Windows não é removido.

## Logs

```text
.docker-local\logs\START_CONTABILIDADE_ultimo.log
```
