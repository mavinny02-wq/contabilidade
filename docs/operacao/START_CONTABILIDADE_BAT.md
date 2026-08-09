# START_CONTABILIDADE.bat

**Classificação:** `CANÔNICO_ATIVO`  
**Modo padrão:** `dev`

## Objetivo

Compilar backend, frontend e automation worker na máquina Windows e entregar ao Docker somente os
artefatos preparados. O BAT não executa fluxo fiscal, não chama Serpro e não resolve CAPTCHA.

## Uso

Na raiz do projeto:

```bat
START_CONTABILIDADE.bat
START_CONTABILIDADE.bat dev
START_CONTABILIDADE.bat onpremise
```

O diretório é derivado de `%~dp0`; o projeto pode permanecer em
`D:\priv\priv\projeto\contabilidade` ou em outro caminho.

## Java 21

O projeto exige JDK 21. O BAT procura, nesta ordem:

- `CONTABILIDADE_JAVA_HOME`;
- `JAVA_HOME`;
- Java no `PATH`;
- instalações comuns de Temurin, Oracle/OpenJDK, Microsoft, Corretto, Liberica e Zulu;
- instalações do IntelliJ, Chocolatey e Scoop.

Uma instalação Java 17 pode continuar existente. O BAT seleciona JDK 21 apenas para seu processo e
confirma que o Maven também está usando Java 21.

Se nenhum JDK 21 for encontrado e o WinGet estiver disponível, o BAT pergunta antes de instalar o
Eclipse Temurin 21. Nada é instalado silenciosamente.

Para apontar manualmente:

```bat
set CONTABILIDADE_JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.x
START_CONTABILIDADE.bat dev
```

## Node e lockfiles

Node 22.12+ é obrigatório. O BAT procura instalações do PATH, NVM e Scoop. Quando não encontra uma
versão compatível, pode oferecer instalação do Node LTS via WinGet.

- `dev`: pode oferecer geração explícita dos lockfiles ausentes;
- `onpremise`: lockfiles ausentes interrompem a execução;
- lockfiles são gerados pelo script canônico `scripts/gerar-lockfiles.ps1`;
- `npm ci` é usado para instalações reproduzíveis.

## Artifact-only

Maven e npm executam no host. O BAT cria contextos em:

```text
.docker-local/artifact-build/backend-context
.docker-local/artifact-build/frontend-context
.docker-local/artifact-build/worker-context
```

Imagens geradas:

```text
contabilidade-backend:<VERSION>
contabilidade-frontend:<VERSION>
contabilidade-automation-worker:<VERSION>
```

Todas recebem o rótulo:

```text
contabilidade.local.artifact-only=true
```

## Segurança operacional

O BAT:

- não executa `git reset`, `git clean` ou `git stash`;
- não apaga volumes;
- não sobrescreve `.env` existente;
- recusa modo on-premise com secrets de exemplo;
- só para containers depois de todos os builds, imagens e Compose passarem;
- não chama portais, Serpro ou APIs pagas;
- não executa testes automatizados.

## Serviços validados

Após a subida:

- PostgreSQL;
- Keycloak;
- backend readiness;
- automation worker `/health`;
- frontend `/healthz`;
- `nginx -t`.

Em caso de falha, o terminal permanece aberto e apresenta logs direcionados.
