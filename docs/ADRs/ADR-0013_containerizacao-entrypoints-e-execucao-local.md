# Containerizacao, Entrypoints e Execucao Local

## Context and Problem Statement

O trabalho exige o sistema rodando e instrucoes claras no README. A solucao precisa subir em uma maquina de apresentacao com instalacao minima alem de Docker Desktop. Tambem precisa aplicar migrations automaticamente e evitar erros comuns de line ending em scripts shell no Windows.

## Requirements Covered

- Todos os requisitos implementados, pois todos dependem do ambiente Docker funcionando.

## Considered Options

* Rodar cada servico manualmente com Node, PostgreSQL e RabbitMQ instalados no host.
* Usar Docker Compose com migrations manuais.
* Usar Docker Compose com entrypoints que aguardam banco e aplicam migrations.

## Decision Outcome

Chosen option: "Docker Compose com entrypoints automaticos", because reduz passos manuais e torna a demonstracao repetivel. Cada servico Node tem Dockerfile proprio; os servicos que usam PostgreSQL instalam `postgresql-client`, aguardam `pg_isready` e executam sua migration antes de iniciar `node server.js`.

Decisoes detalhadas:

- `auth-service` usa Node 18-alpine.
- `payment-service` usa Node 20-alpine por compatibilidade com `opossum@9`.
- `evidence-service` usa Node 18-alpine.
- `notification-service` usa Node 18-alpine.
- `.gitattributes` fixa `*.sh text eol=lf` para evitar erro de shell em containers Linux.
- `docker-compose.yml` nao usa mais a chave obsoleta `version`.

### Consequences

* Good, because `docker compose up --build -d` sobe o sistema completo.
* Good, because a base local fica mais proxima da demonstracao e da validacao.
* Bad, because a primeira execucao depende de download de imagens Docker.
* Bad, because volumes persistentes podem manter dados de execucoes anteriores, exigindo `docker compose down -v` para um teste totalmente limpo.

## Evidence

- `docker-compose.yml`
- `.gitattributes`
- `auth-service/Dockerfile`
- `payment-service/Dockerfile`
- `evidence-service/Dockerfile`
- `notification-service/Dockerfile`
- `auth-service/entrypoint.sh`
- `payment-service/entrypoint.sh`
- `evidence-service/entrypoint.sh`
- `README.md`
- `docs/COMO_RODAR_WINDOWS.md`

