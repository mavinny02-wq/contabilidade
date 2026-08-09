# Instalação on-premise

## Recomendação

Servidor Linux dedicado, Docker Engine e plugin Docker Compose. O servidor deve permanecer ligado e
possuir nobreak quando possível.

## Preparação

1. configure DNS interno, por exemplo `contabilidade.local`;
2. configure HTTPS no proxy corporativo;
3. copie `.env.example` para `.env`;
4. altere todas as senhas/tokens;
5. use `KEYCLOAK_REALM_FILE=realm-contabilidade.json`;
6. ajuste `PUBLIC_BASE_URL`;
7. crie diretórios `dados/documentos` e `dados/backups`;
8. execute:

```bash
docker compose -f compose.yaml -f compose.onpremise.yaml up -d --build
```

## Primeiro acesso

Acesse `/auth/admin`, crie usuários e atribua papéis. O realm de produção não contém usuário da
aplicação.

## Obrigatório antes de uso real

- HTTPS;
- firewall;
- backup externo;
- restauração testada;
- senhas fortes;
- patches;
- monitoramento de espaço;
- política de atualização.
