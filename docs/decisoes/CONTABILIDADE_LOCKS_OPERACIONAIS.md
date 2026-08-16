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
| `LOCK-AI-001` | IA não executa ação fiscal autoritativa sem contrato/confirmação humana |

## Aplicação

- Teste contradiz lock: `TEST_CONTRACT_DRIFT`.
- Produção contradiz lock: regressão bounded.
- Contratos ativos conflitantes sem lock resolutivo: `PRODUCT_CONTRACT_CONFLICT`.
- Evidência antiga não remove reprodução atual do usuário.
- Alteração de lock exige decisão/documentação explícita e guard proporcional.
