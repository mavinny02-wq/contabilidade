# Locks operacionais e de produto

**Classificação:** `LOCKED_ACCEPTED_PRODUCT_DECISIONS`

Estes locks impedem regressões silenciosas. Leia somente os IDs mapeados ao owner da task.

| ID | Decisão |
|---|---|
| `LOCK-DEP-001` | produto é on-premise first e cloud-compatible |
| `LOCK-GIT-001` | GitHub/merge define integração; sem push direto na `main` |
| `LOCK-EXT-001` | provider fiscal real é negado por padrão |
| `LOCK-COST-001` | chamada paga exige autorização explícita e limite de custo |
| `LOCK-DATA-001` | credenciais e dados reais são proibidos em automação/CI |
| `LOCK-AUT-001` | não burlar CAPTCHA, MFA, anti-bot ou intervenção humana |
| `LOCK-ENV-001` | Cloud não substitui prova Windows/Docker Desktop |
| `LOCK-DB-001` | PostgreSQL autoritativo; Flyway exclusivo; migration aplicada é imutável |
| `LOCK-MIG-001` | no máximo um migration owner por onda |
| `LOCK-WAVE-001` | onda tem até cinco owners totais, pode ter menos e não aceita filler |
| `LOCK-TEST-001` | falha é classificada antes de mudar produção |
| `LOCK-EVID-001` | evidência válida é reutilizada; rerun é focado |
| `LOCK-DOC-001` | conteúdo documental usa storage; acesso exige autorização/integridade |
| `LOCK-ORQ-DOC-001` | documentação-only que o orquestrador consegue atualizar diretamente no GitHub é feita pelo próprio orquestrador; não vira task, launcher ou slot do Codex |
| `LOCK-STARTUP-001` | startup só é declarado verde após primeiro e segundo `START_CONTABILIDADE.bat dev` em Windows/Docker Desktop, com probe idempotente, PostgreSQL reutilizado e testes integrados; static/Linux não substituem essa prova |
| `LOCK-AI-001` | IA não executa ação fiscal autoritativa sem contrato/confirmação humana |

## Aplicação de `LOCK-STARTUP-001`

- todo comando Docker do startup deve usar executor nativo central baseado em exit code;
- stderr nativo não pode encerrar o script antes da classificação;
- container temporário ausente é estado esperado somente no cleanup autorizado;
- falha real de daemon, permissão, API, create, remove ou ownership continua vermelha;
- cleanup idempotente deve cobrir ausência, stopped, running e remoção concorrente;
- probe deve possuir label project-scoped antes de remoção forçada;
- `finally` não pode apagar a causa original;
- `2>$null`, `*>$null`, swallow genérico ou mudança global para `SilentlyContinue` não constituem correção;
- Pester mockado, integração Docker real e Compose E2E são obrigatórios;
- primeira execução e execução repetida devem ser comprovadas no mesmo SHA;
- nenhuma wave funcional ou estrutural comum pode ser liberada durante
  `P0_STARTUP_RELIABILITY_HOLD`;
- a única exceção é uma wave de recuperação P0 com um único owner serial que reúna a correção do
  startup e seus testes/harness inseparáveis; a validação Windows final permanece uma campanha
  posterior, pinada ao SHA integrado.

## Aplicação geral

- Teste contradiz lock: `TEST_CONTRACT_DRIFT`.
- Produção contradiz lock: regressão bounded.
- Contratos ativos conflitantes sem lock resolutivo: `PRODUCT_CONTRACT_CONFLICT`.
- Evidência antiga não remove reprodução atual do usuário.
- Alteração de lock exige decisão/documentação explícita e guard proporcional.
- `LOCK-ORQ-DOC-001` não retira do executor o `RESULT_MD` nem documentação inseparável de código;
  ele impede criar execução Codex somente para manter índices, checkpoint, ledger, backlog e seleção.

`LOCKS_OPERACIONAIS_WITH_STARTUP_P0`
