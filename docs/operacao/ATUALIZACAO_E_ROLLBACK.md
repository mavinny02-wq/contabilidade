# Atualização e rollback

## Preflight do pacote

Antes de qualquer mudança real, a Console Técnica permite validar um manifesto JSON em
`Atualizações`.

O preflight verifica:

- versão de destino superior à instalada;
- origem mínima compatível;
- componentes obrigatórios;
- nomes seguros e sem path traversal;
- tamanhos declarados;
- formato dos hashes SHA-256;
- duplicidades;
- versão do schema do manifesto.

O preflight **não**:

- baixa artefatos;
- verifica o conteúdo físico dos arquivos;
- executa scripts;
- aplica migrations;
- reinicia containers;
- substitui código;
- cria ou restaura backup.

A aprovação do manifesto é somente uma pré-condição. O operador ainda deve conferir os artefatos,
validar seus hashes físicos, revisar migrations e confirmar o backup.

## Atualização

1. executar o preflight do manifesto;
2. gerar e verificar backup;
3. baixar a nova versão por canal autorizado;
4. conferir SHA-256 dos artefatos físicos contra o manifesto;
5. revisar migrations e compatibilidade de rollback;
6. executar build/pull de imagens;
7. subir backend;
8. aguardar health e migrations;
9. subir frontend/worker;
10. validar fluxos críticos;
11. registrar versão e evidências.

## Rollback

Código pode voltar; schema nem sempre. Toda migration deve ser forward-safe. Quando uma migration
não for reversível, o plano de rollback deve ser restauração do backup ou migration corretiva
explicitamente preparada.

Nunca execute rollback sem confirmar:

- backup íntegro e compatível;
- impacto das migrations aplicadas;
- janela operacional;
- responsável e aprovação;
- plano de verificação posterior.
