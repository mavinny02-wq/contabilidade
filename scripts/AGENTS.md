# Regras de agentes — scripts

Este arquivo especializa o contrato da raiz para `scripts/**`.

- Scripts operacionais devem ser seguros, repetíveis, explícitos e não destrutivos por padrão.
- Não delete volume, backup, documento, cache global ou estado persistente sem comando e confirmação
  específicos.
- Diferencie artefato Cloud/Linux de execução humana Windows/Docker Desktop.
- Não inclua segredo, credencial ou dado fiscal real.
- Mantenha PowerShell/BAT e shell com mensagens acionáveis e exit code confiável.
- Alterações no startup/deploy são hotspot serial e não podem sobrepor owner aberto.
