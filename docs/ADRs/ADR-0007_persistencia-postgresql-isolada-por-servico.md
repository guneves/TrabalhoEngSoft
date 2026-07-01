# Persistencia PostgreSQL Isolada por Servico

## Context and Problem Statement

Os requisitos implementados precisam persistir dados de usuarios, tokens de recuperacao, pacotes, compras e solicitacoes de prova. A arquitetura de microsservicos perde isolamento se todos os dominios compartilharem o mesmo schema ou se os dados ficarem em memoria. Tambem e necessario que a aplicacao suba localmente com Docker Compose sem passos manuais de criacao de tabelas.

## Requirements Covered

- REQ01: cadastro de usuario.
- REQ02: recuperacao de senha.
- REQ05: catalogo de pacotes e compras.
- REQ08: criar solicitacao de prova.
- REQ09: listar solicitacoes de prova.
- REQ10: detalhar solicitacao de prova.

## Considered Options

* Banco unico compartilhado - todos os servicos usam o mesmo PostgreSQL e separam dados por tabelas.
* Banco em memoria/JSON local - simplifica execucao, mas nao demonstra persistencia real.
* PostgreSQL isolado por servico - cada dominio tem seu banco e suas migrations.

## Decision Outcome

Chosen option: "PostgreSQL isolado por servico", because preserva o limite de cada microsservico e evita acoplamento direto entre dominios. O `docker-compose.yml` declara `db_auth`, `db_payment` e `db_evidence`; cada servico recebe variaveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD`.

Cada servico executa sua migration no `entrypoint.sh` antes de iniciar o servidor:

- `auth-service/migrations/001_create_users.sql`
- `payment-service/migrations/001_create_tables.sql`
- `evidence-service/migrations/001_create_evidence_requests.sql`

### Consequences

* Good, because cada servico pode evoluir seu schema sem coordenar migrations globais.
* Good, because os dados sobrevivem a restart dos containers por volumes Docker.
* Bad, because a execucao local sobe mais containers e consome mais recursos.
* Bad, because consultas cruzadas entre dominios devem passar por APIs ou eventos, nao por joins diretos.

## Evidence

- `docker-compose.yml`
- `auth-service/db.js`
- `payment-service/db.js`
- `evidence-service/db.js`
- `auth-service/entrypoint.sh`
- `payment-service/entrypoint.sh`
- `evidence-service/entrypoint.sh`

