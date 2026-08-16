# STR-ORQ-002 — registry e guard de migrations

**Objetivo:** impedir duplicata, retrocesso e concorrência Flyway.

## Escopo

- inventariar migrations reais;
- registrar frontier e hashes;
- validar nome/versão únicos e sequência aceitável;
- detectar nova migration <= frontier;
- integrar guard à CI;
- atualizar checkpoint sem duplicar inventário inteiro.

## Locks

`LOCK-DB-001`, `LOCK-MIG-001`.

## Aceite

- V1–V12 inventariadas;
- duplicata/retrocesso falham claramente;
- applied migration não é editada;
- wave pack com mais de um owner de migration é rejeitado.
