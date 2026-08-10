# Correção da validação Nginx e memória WSL

## Revisão

`FULL-REBUILD-NGINX-NETWORK-FIX-2026-08-10-03`

## Causa do falso erro

A imagem frontend contém uma configuração Nginx com upstream `backend`.

Antes de a stack Compose existir, um `docker run` isolado não participa da rede Compose e não
consegue resolver o hostname `backend`. Portanto, executar `nginx -t` em um container isolado
produzia:

```text
host not found in upstream "backend"
```

Isso não significava que a imagem estava inválida.

## Correção

Antes do Compose, o BAT valida apenas:

- binário Nginx;
- `default.conf`;
- `index.html`;
- script de configuração runtime.

Depois de `docker compose up --no-build -d`, o BAT executa `nginx -t` dentro do container frontend,
já conectado à rede Compose onde `backend` pode ser resolvido.

## Memória do VmmemWSL

O START não executa limpeza automática. Build cache acelera execuções futuras, e `wsl --shutdown`
interrompe todos os containers e distribuições WSL.

`LIBERAR_MEMORIA_DOCKER.bat` oferece, com confirmação separada:

1. `docker builder prune --force`;
2. `wsl --shutdown`.

Use a segunda opção apenas quando puder interromper Docker e WSL.
