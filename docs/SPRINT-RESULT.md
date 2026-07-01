# SPRINT-RESULT.md — Veridit | Resultado das Fases de Implementação

> Disciplina: Engenharia de Software I — Prof. Dr. Eduardo Almeida  
> Trabalho III | Repositório: `microservices_system`  
> Atualizado em: 2026-06-30
> Resultado atual: **11 de 15 requisitos = 73,3%**

---

## Sprint 1 — Quitação da Dívida Técnica Inicial

> Objetivo: corrigir problemas iniciais de segurança, persistência e autenticação antes de construir features novas. Nenhum requisito novo foi entregue nesta sprint.

### Fase 1.1 — Remover fallback inseguro e conectar auth-service ao PostgreSQL

**Status:** ✅ Concluída

**Arquivos criados:**
- `auth-service/db.js` — módulo de conexão PostgreSQL via variáveis de ambiente.
- `auth-service/migrations/001_create_users.sql` — tabela `users` com campos de usuário e tabela `password_reset_tokens`.

**Arquivos editados:**
- `frontend/login.html` — fallback inseguro removido.
- `auth-service/server.js` — persistência em memória substituída por PostgreSQL.
- `auth-service/package.json` — dependências `pg`, `bcrypt` e `jsonwebtoken`.
- `docker-compose.yml` — variáveis de banco e `JWT_SECRET` injetadas no serviço.

**ADRs aplicadas:** ADR-0005, ADR-0007, ADR-0008

**Resultado:** autenticação passou a falhar de forma explícita quando o backend está indisponível e passou a persistir usuários em banco.

### Fase 1.2 — Adicionar validação JWT no payment-service

**Status:** ✅ Concluída

**Arquivos criados:**
- `payment-service/middlewares/auth.js` — middleware que valida `Authorization: Bearer <token>`.

**Arquivos editados:**
- `payment-service/server.js` — checkout protegido por JWT.
- `payment-service/package.json` — dependência `jsonwebtoken`.
- `docker-compose.yml` — mesmo `JWT_SECRET` injetado no `payment-service`.

**ADRs aplicadas:** ADR-0005, ADR-0012

**Resultado:** rotas protegidas de pagamento deixaram de aceitar clientes não autenticados.

---

## Sprint 2 — Domínio de Autenticação (REQ01, REQ03, REQ04)

> Objetivo: cadastro, login e logout funcionando de ponta a ponta.

### Fase 2.1 — REQ01: Cadastro de Usuário

**Status:** ✅ Concluída

**Arquivos criados:**
- `auth-service/repositories/userRepository.js` — `createUser(data)` e `findByEmail(email)`.
- `auth-service/services/authService.js` — `register(userData)`.
- `auth-service/entrypoint.sh` — aguarda PostgreSQL e executa migration.

**Arquivos editados:**
- `auth-service/server.js` — `POST /auth/register` delega ao service.
- `frontend/cadastro.html` — cadastro integrado ao gateway.
- `auth-service/Dockerfile` — entrypoint configurado.

**Endpoint entregue:** `POST /api/auth/register`

**Resultado:** cadastro de usuário comum e advogado com validação de campos e email único.

### Fase 2.2 — REQ03 + REQ04: Login e Logout

**Status:** ✅ Concluída

**Arquivos editados:**
- `auth-service/services/authService.js` — `login(email, senha)` com `bcrypt.compare` e JWT `expiresIn: '8h'`.
- `auth-service/server.js` — `POST /auth/login`.
- `frontend/login.html` — token salvo em `localStorage`.
- `frontend/creditos.html` e `frontend/checkout.html` — logout client-side.

**Endpoints/mecanismos entregues:**
- `POST /api/auth/login`
- `localStorage.removeItem('veridit_token')` + redirect para login

**Resultado:** login retorna JWT stateless e logout remove o token no cliente, conforme ADR-0005.

---

## Sprint 3 — Domínio de Pagamento (REQ05, REQ06)

> Objetivo: catálogo de pacotes, seleção e checkout real com persistência e circuit breaker.

### Fase 3.1 — REQ05: Catálogo de Pacotes e Compra de Créditos

**Status:** ✅ Concluída

**Arquivos criados:**
- `payment-service/db.js`
- `payment-service/entrypoint.sh`
- `payment-service/migrations/001_create_tables.sql`
- `payment-service/repositories/packageRepository.js`
- `payment-service/repositories/purchaseRepository.js`
- `payment-service/services/paymentService.js`

**Arquivos editados:**
- `payment-service/server.js` — `GET /payments/packages` e `POST /payments/checkout`.
- `payment-service/Dockerfile` — `postgresql-client` para migrations.
- `frontend/checkout.html` — chamada real ao backend com JWT.
- `docker-compose.yml` — banco exclusivo `db_payment`.

**Endpoints entregues:**
- `GET /api/payments/packages`
- `POST /api/payments/checkout`

**Resultado:** catálogo público e checkout persistido em PostgreSQL.

### Fase 3.2 — REQ06: Geração de QR Code / PIX

**Status:** ✅ Concluída

**Arquivos criados:**
- `payment-service/services/pixService.js` — `generatePixCode(purchaseId, value)`.
- `payment-service/resilience/circuitBreaker.js` — wrapper com `opossum`.

**Arquivos editados:**
- `payment-service/services/paymentService.js` — usa `pixService` e circuit breaker.
- `payment-service/repositories/purchaseRepository.js` — `findById(id)`.
- `payment-service/server.js` — `GET /payments/purchases/:id`.

**Resultado:** checkout retorna `pixCode` simulado e falhas do banco geram 503 em vez de travamento.

---

## Sprint 4 — Infraestrutura e Demonstração (REQ07 + API Gateway + Docs)

> Objetivo: mensageria assíncrona, API Gateway nginx e documentação final.

### Fase 4.1 — REQ07: Confirmação de Pagamento por Email via RabbitMQ

**Status:** ✅ Concluída

**Arquivos criados:**
- `notification-service/package.json`
- `notification-service/Dockerfile`
- `notification-service/index.js`
- `payment-service/messaging/publisher.js`

**Arquivos editados:**
- `docker-compose.yml` — `rabbitmq` e `notification-service`.
- `payment-service/services/paymentService.js` — publica evento após checkout.

**Mecanismo entregue:**
- Exchange `payment_events`
- Fila `payment.confirmed`
- DLQ `payment.confirmed.dlq`

**Resultado:** confirmação por email simulada via log, com fluxo assíncrono e DLQ.

### Fase 4.2 — API Gateway (nginx) + Remoção de URLs Hardcoded

**Status:** ✅ Concluída

**Arquivos criados/editados:**
- `gateway/nginx.conf` — proxy para `/api/auth`, `/api/payments` e frontend.
- `docker-compose.yml` — gateway exposto na porta 80.
- `frontend/*.html` — chamadas usando `/api/...`.

**Resultado:** frontend e APIs passam por `http://localhost`.

### Fase 4.3 — Documentação SOLID e README Final

**Status:** ✅ Concluída

**Arquivos criados/editados:**
- `docs/SOLID_AUDIT.md`
- `docs/REQUIREMENTS_SPRINT1.md`
- `docs/SPRINT-RESULT.md`
- `docs/ESTADO_ATUAL_TRABALHO3.md`
- `README.md`

---

## Sprint 5 — Expansão para 70%+ (REQ02, REQ08, REQ09, REQ10, REQ15)

> Objetivo: elevar a entrega para acima de 70% com requisitos de baixo risco, aproveitando autenticação, gateway, PostgreSQL e JWT já existentes.

### Fase 5.1 — REQ02: Recuperação de Senha

**Status:** ✅ Concluída

**Arquivos editados:**
- `auth-service/migrations/001_create_users.sql` — tabela `password_reset_tokens`.
- `auth-service/repositories/userRepository.js` — `updatePassword`, `createPasswordResetToken`, `findValidPasswordResetToken`, `markPasswordResetTokenUsed`.
- `auth-service/services/authService.js` — `requestPasswordReset(email)` e `resetPassword(token, novaSenha)`.
- `auth-service/server.js` — rotas `POST /auth/password/forgot` e `POST /auth/password/reset`.

**Endpoints entregues:**
- `POST /api/auth/password/forgot`
- `POST /api/auth/password/reset`

**Resultado:** fluxo de recuperação com token temporário, hash SHA-256 no banco, expiração de 30 minutos e email simulado por log.

### Fase 5.2 — REQ08, REQ09, REQ10: Solicitações de Prova

**Status:** ✅ Concluída

**Arquivos criados:**
- `evidence-service/package.json`
- `evidence-service/Dockerfile`
- `evidence-service/entrypoint.sh`
- `evidence-service/db.js`
- `evidence-service/middlewares/auth.js`
- `evidence-service/migrations/001_create_evidence_requests.sql`
- `evidence-service/repositories/evidenceRepository.js`
- `evidence-service/services/evidenceService.js`
- `evidence-service/server.js`

**Arquivos editados:**
- `docker-compose.yml` — adiciona `evidence-service` e `db_evidence`.
- `gateway/nginx.conf` — adiciona proxy `/api/evidence/*`.

**Endpoints entregues:**
- `POST /api/evidence/requests`
- `GET /api/evidence/requests`
- `GET /api/evidence/requests/:id`

**Resultado:** criação, listagem e detalhamento de solicitações de prova protegidas por JWT e filtradas por `userId`.

### Fase 5.3 — REQ15: Download do ZIP Final Simulado

**Status:** ✅ Concluída

**Arquivos criados/editados:**
- `evidence-service/utils/zipBuilder.js` — gerador ZIP sem dependência externa.
- `evidence-service/services/evidenceService.js` — `buildDownloadZip(userId, id)`.
- `evidence-service/server.js` — `GET /evidence/requests/:id/download`.

**Endpoint entregue:**
- `GET /api/evidence/requests/:id/download`

**Resultado:** download de ZIP contendo `evidence-request-<id>.json` e `relatorio.txt`. O arquivo final é simulado e documenta que a captura real de mídia ainda não foi executada.

---

## Resumo Final

### Requisitos Entregues

| Requisito | Descrição | Status |
|-----------|-----------|--------|
| REQ01 | Cadastrar Usuário (advogado e comum) | ✅ Entregue |
| REQ02 | Recuperar senha | ✅ Entregue |
| REQ03 | Logar no Sistema | ✅ Entregue |
| REQ04 | Sair do Sistema | ✅ Entregue |
| REQ05 | Comprar Créditos (selecionar pacote) | ✅ Entregue |
| REQ06 | Efetuar Pagamento (PIX simulado + circuit breaker) | ✅ Entregue |
| REQ07 | Confirmar pagamento por email via RabbitMQ | ✅ Entregue |
| REQ08 | Criar solicitação de captura/prova | ✅ Entregue |
| REQ09 | Listar minhas solicitações de prova | ✅ Entregue |
| REQ10 | Consultar detalhe de solicitação de prova | ✅ Entregue |
| REQ15 | Baixar ZIP final simulado | ✅ Entregue |

**Total: 11 de 15 requisitos = 73,3%**

### Requisitos Fora do Escopo Atual

REQ11, REQ12, REQ13 e REQ14 permanecem fora do escopo por exigirem captura real de mídia, processamento avançado e relatório forense completo.

### Serviços Implementados

| Serviço | Papel |
|---------|-------|
| `gateway` | API Gateway + frontend estático |
| `auth-service` | Cadastro, login, logout client-side e recuperação de senha |
| `payment-service` | Catálogo, checkout, PIX simulado e circuit breaker |
| `evidence-service` | Solicitações de prova e ZIP final simulado |
| `notification-service` | Confirmação de pagamento por email via RabbitMQ |
| `rabbitmq` | Broker com DLX/DLQ |
| `db_auth` | PostgreSQL do auth-service |
| `db_payment` | PostgreSQL do payment-service |
| `db_evidence` | PostgreSQL do evidence-service |

**Total: 9 containers, 5 serviços de aplicação**
