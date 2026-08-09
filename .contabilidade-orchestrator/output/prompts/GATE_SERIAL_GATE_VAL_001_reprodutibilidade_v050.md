# GATE_SERIAL — Reprodutibilidade técnica da v0.5.0

- **TASK:** corrigir blockers técnicos e comprovar baseline reproduzível
- **TYPE:** `BUG FIX / DEPENDENCY LOCK / VALIDATION`
- **ITEM:** `GATE-VAL-001`
- **BASELINE:** último `main`, após comprovar ancestralidade do commit analisado
- **EXECUTION MODE:** `CLOUD_FIRST`

## Objetivo

Em execução serial, corrigir `BUG-VAL-001` e `BUG-VAL-002`, gerar/revisar os dois lockfiles com
Node suportado e comprovar builds locais sem realizar operação fiscal externa. Este gate não autoriza
uma onda de cinco slots enquanto permanecer vermelho.

## Caminhos próprios

- `frontend/src/features/intervencoes/InteractiveSessionModal.tsx`;
- `frontend/package-lock.json`;
- `automation-worker/src/PdfCertificateParser.ts`;
- `automation-worker/src/StateCertificatePdfParser.ts`;
- `automation-worker/package-lock.json`.

## Caminhos excluídos

Backend, migrations, Compose, realms, demais capacidades fiscais e documentação canônica compartilhada.

## Dependências

Nenhuma dependência de slot; esta é uma barreira serial anterior à onda.

## Propriedade de migration

Nenhuma migration. É proibido criar ou alterar SQL/Flyway.

## Fronteira de segurança

Não usar credenciais/CNPJ reais, não chamar Serpro ou portais, não tratar CAPTCHA, não enfraquecer
validação PDF, HMAC, autorização ou tipagem para obter build verde.

## Validação permitida

`npm ci`, `npm run locale:validate`, `npm run typecheck`, `npm run build`, Maven compile/package,
Compose config e stack local sem chamadas fiscais quando o ambiente permitir. Testes novos ou
alterados permanecem fora deste gate.

## Provas pendentes

Ancestralidade com `origin/main`; lockfiles revisados/licenças transitivas; builds frontend/worker;
Maven sem bloqueio de registry; Compose/Flyway/Keycloak e healthchecks; execução do BAT em Windows.

## Contrato de saída

Entregar diff focado, comandos/exit codes, hashes dos lockfiles, licenças novas (se houver), estado
Git e lista explícita de provas ainda pendentes. A reconciliação de Registry/Roadmap/Board/Histórico
é serial posterior.
