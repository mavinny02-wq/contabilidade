# Atualização e rollback

## Atualização

1. gerar backup;
2. baixar nova versão;
3. revisar migrations;
4. executar build/pull de imagens;
5. subir backend;
6. aguardar health;
7. subir frontend/worker;
8. validar fluxos críticos;
9. registrar versão.

## Rollback

Código pode voltar; schema nem sempre. Toda migration deve ser forward-safe. Quando uma migration
não for reversível, o plano de rollback deve ser restauração do backup ou migration corretiva
explicitamente preparada.
