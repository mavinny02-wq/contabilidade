# Segurança

- autenticação Keycloak/OIDC;
- autorização backend pelo Catálogo de Permissões;
- modo sem autenticação apenas para desenvolvimento;
- segredos fora do frontend;
- documentos autorizados antes do download;
- logs com correlationId e sem payload sensível;
- token interno do worker;
- CORS configurável;
- realm de desenvolvimento separado;
- HTTPS obrigatório na instalação real;
- nenhum bypass de CAPTCHA.

O arquivo `.env` deve ter permissão restrita e não ser commitado.
