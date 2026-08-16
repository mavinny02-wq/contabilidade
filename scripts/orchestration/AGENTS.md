# Regras de agentes — tooling de orquestração

Este arquivo especializa `scripts/AGENTS.md` para `scripts/orchestration/**`.

- Use somente Python standard library salvo decisão explícita.
- Guards são determinísticos, rápidos e sem acesso de rede/provider.
- Estimativa de tokens nunca é rotulada como uso real do provedor.
- Toda regra bloqueante deve possuir teste unitário.
- Mensagens de erro devem indicar código, path e correção esperada.
- O tooling valida estrutura e invariantes; não inventa decisão semântica de produto.
