# DEC-DEP-001 — Implantação on-premise first

**Status:** APROVADA
**Data:** 2026-08-09

## Decisão

A aplicação será inicialmente uma aplicação web instalada em servidor local dedicado da empresa.

## Consequências

- usuários acessam pelo navegador;
- uma instalação central;
- PostgreSQL, documentos e worker no servidor;
- sem mensalidade obrigatória de cloud;
- cliente assume energia, hardware, patches e backup;
- backup externo criptografado continua recomendado;
- arquitetura não pode depender de IP fixo, `localhost` ou filesystem sem abstração;
- nuvem permanece opção futura.

Desktop instalado em cada computador não é o modelo-alvo.
