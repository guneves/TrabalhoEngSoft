# ESTADO_ATUAL — Trabalho III (Veridit) · Eng. Software I / BCC-UFBA

> Atualizado em: 2026-06-30
> Repositório: `microservices_system`  
> Estado: **FINAL ATUALIZADO** — 11 de 15 requisitos implementados
> Taxa de entrega: **73,3%**

---

## 1. Raio-X da Implementação Atual

### 1.1 Mapeamento de Arquivos → Componentes

**auth-service** — Microsserviço de Autenticação (porta interna 3001)

| Arquivo | Papel |
|---------|-------|
| `auth-service/server.js` | Roteamento HTTP; controllers de cadastro, login e recuperação de senha |
| `auth-service/services/authService.js` | Regras de negócio: `register()`, `login()`, `requestPasswordReset()` e `resetPassword()` |
| `auth-service/repositories/userRepository.js` | Acesso SQL a `users` e `password_reset_tokens` |
| `auth-service/db.js` | Pool de conexão PostgreSQL via variáveis de ambiente |
| `auth-service/migrations/001_create_users.sql` | Schema de usuários e tokens de recuperação |
| `auth-service/entrypoint.sh` | Aguarda PostgreSQL e executa migration antes de subir |
| `auth-service/Dockerfile` | Node 18-alpine; entrypoint configurado |
| `auth-service/package.json` | Dependências: express, cors, pg, bcrypt, jsonwebtoken |

**payment-service** — Microsserviço de Pagamentos (porta interna 3002)

| Arquivo | Papel |
|---------|-------|
| `payment-service/server.js` | Roteamento HTTP; controllers de pacotes, checkout e consulta de compra |
| `payment-service/services/paymentService.js` | Regras de negócio de pagamento |
| `payment-service/services/pixService.js` | Geração de código PIX simulado |
| `payment-service/repositories/packageRepository.js` | Acesso SQL a `credit_packages` |
| `payment-service/repositories/purchaseRepository.js` | Acesso SQL a `purchases` |
| `payment-service/db.js` | Pool PostgreSQL do serviço |
| `payment-service/middlewares/auth.js` | Middleware JWT local |
| `payment-service/messaging/publisher.js` | Publica eventos no RabbitMQ |
| `payment-service/resilience/circuitBreaker.js` | Circuit breaker via `opossum` |
| `payment-service/migrations/001_create_tables.sql` | Schema e seed dos pacotes |
| `payment-service/entrypoint.sh` | Aguarda banco e executa migration |
| `payment-service/Dockerfile` | Node 20-alpine com postgresql-client |
| `payment-service/package.json` | Dependências: express, cors, pg, jsonwebtoken, opossum, amqplib |

**evidence-service** — Microsserviço de Evidências/Provas Digitais (porta interna 3003)

| Arquivo | Papel |
|---------|-------|
| `evidence-service/server.js` | Roteamento HTTP de solicitações de prova e download ZIP |
| `evidence-service/services/evidenceService.js` | Regras de criação, listagem, detalhe e ZIP |
| `evidence-service/repositories/evidenceRepository.js` | Acesso SQL a `evidence_requests` |
| `evidence-service/middlewares/auth.js` | Middleware JWT local |
| `evidence-service/utils/zipBuilder.js` | Geração de arquivo ZIP sem dependência externa |
| `evidence-service/db.js` | Pool PostgreSQL do serviço |
| `evidence-service/migrations/001_create_evidence_requests.sql` | Schema de solicitações de prova |
| `evidence-service/entrypoint.sh` | Aguarda banco e executa migration |
| `evidence-service/Dockerfile` | Node 18-alpine com postgresql-client |
| `evidence-service/package.json` | Dependências: express, cors, pg, jsonwebtoken |

**notification-service** — Consumidor de Eventos (sem porta exposta ao host)

| Arquivo | Papel |
|---------|-------|
| `notification-service/index.js` | Consome `payment.confirmed`; loga confirmação de email; DLX/DLQ configurados |
| `notification-service/Dockerfile` | Node 18-alpine |
| `notification-service/package.json` | Dependência: amqplib |

**gateway** — API Gateway (nginx, porta host 80)

| Arquivo | Papel |
|---------|-------|
| `gateway/nginx.conf` | Proxy reverso: `/api/auth/*`, `/api/payments/*`, `/api/evidence/*` e frontend estático |

**frontend** — Interface Web (HTML/CSS/JS puro, servida pelo gateway)

| Arquivo | Papel |
|---------|-------|
| `frontend/index.html` | Entrada principal; redireciona para `login.html` |
| `frontend/login.html` | Tela de login; usa `AUTH_BASE = '/api/auth'` |
| `frontend/cadastro.html` | Formulário de cadastro; usa `AUTH_BASE = '/api/auth'` |
| `frontend/creditos.html` | Catálogo de pacotes visual; logout client-side |
| `frontend/checkout.html` | Checkout com fetch real ao backend; usa `PAYMENTS_BASE = '/api/payments'` |

**Infraestrutura**

| Arquivo | Papel |
|---------|-------|
| `docker-compose.yml` | Orquestra gateway, 4 serviços de aplicação, RabbitMQ e 3 bancos PostgreSQL |

---

### 1.2 Stack Tecnológica

- **Runtime:** Node.js 18/20 (payment-service usa Node 20 por compatibilidade com `opossum@9`)
- **Framework HTTP:** Express.js 4.x
- **Auth:** bcrypt + jsonwebtoken
- **Banco de Dados:** PostgreSQL 15 — `db_auth`, `db_payment`, `db_evidence`
- **Message Broker:** RabbitMQ 3-management
- **Resiliência:** opossum (circuit breaker)
- **API Gateway:** nginx:alpine
- **Containerização:** Docker + Docker Compose
- **Frontend:** HTML/CSS/JS puro

---

### 1.3 Status por Componente

| Componente | Status | Detalhe |
|---|---|---|
| Auth Service — Registro (REQ01) | ✅ Funcional | Persiste em PostgreSQL; validação por tipo; 201/400/409 |
| Auth Service — Recuperação de senha (REQ02) | ✅ Funcional | Token temporário com hash SHA-256, expiração e uso único |
| Auth Service — Login (REQ03) | ✅ Funcional | JWT com `{ userId, email, tipo }`, `expiresIn: '8h'` |
| Auth Service — Logout (REQ04) | ✅ Funcional | Client-side conforme ADR-0005 |
| Payment Service — Catálogo (REQ05) | ✅ Funcional | `GET /api/payments/packages` retorna pacotes do banco |
| Payment Service — Checkout (REQ05/REQ06) | ✅ Funcional | JWT validado; compra persistida; `pixCode` gerado |
| Payment Service — Circuit Breaker (REQ06) | ✅ Funcional | `opossum` com timeout 3s; retorna 503 quando banco indisponível |
| Notification Service — Email via RabbitMQ (REQ07) | ✅ Funcional | Consome `payment.confirmed`; loga `[EMAIL]`; DLQ ativa |
| Evidence Service — Criar prova (REQ08) | ✅ Funcional | `POST /api/evidence/requests` |
| Evidence Service — Listar provas (REQ09) | ✅ Funcional | `GET /api/evidence/requests` filtrado por usuário |
| Evidence Service — Detalhar prova (REQ10) | ✅ Funcional | `GET /api/evidence/requests/:id` com ownership por JWT |
| Evidence Service — ZIP final (REQ15) | ✅ Funcional | `GET /api/evidence/requests/:id/download` |
| API Gateway (nginx) | ✅ Funcional | Único ponto de entrada na porta 80 |
| Message Broker (RabbitMQ) | ✅ Funcional | Exchange `payment_events` + DLX/DLQ |

---

## 2. Aderência à Arquitetura

### 2.1 Táticas Arquiteturais

| Tática | Status | Evidência no Código |
|--------|--------|---------------------|
| Microsserviços por subdomínio | ✅ Implementado | `auth-service`, `payment-service`, `evidence-service`, `notification-service` |
| API Gateway | ✅ Implementado | `gateway/nginx.conf` |
| Bancos isolados por serviço | ✅ Implementado | `db_auth`, `db_payment`, `db_evidence` |
| JWT stateless | ✅ Implementado | middlewares locais em `payment-service` e `evidence-service` |
| Message Broker assíncrono | ✅ Implementado | RabbitMQ + `notification-service` |
| Dead-Letter Queue | ✅ Implementado | `payment.confirmed.dlq` |
| Circuit Breaker | ✅ Implementado | `payment-service/resilience/circuitBreaker.js` |
| Arquivo final ZIP | ✅ Implementado | `evidence-service/utils/zipBuilder.js` |

### 2.2 Limitações Conhecidas

| Item | Situação |
|------|----------|
| PIX real | Simulado; sem integração bancária ou provedor externo |
| Email real | Simulado por log no container |
| Captura real de mídia | Fora do escopo atual |
| Relatório forense completo | Fora do escopo atual |
| ZIP final | Simulado com JSON e relatório textual |

---

## 3. Auditoria SOLID

### Pontos onde SOLID foi aplicado no código final

| Princípio | Arquivo | Descrição |
|-----------|---------|-----------|
| SRP | `auth-service/db.js` | Gerencia exclusivamente a conexão com o banco |
| SRP | `auth-service/repositories/userRepository.js` | Encapsula SQL de usuários e tokens de recuperação |
| SRP | `auth-service/services/authService.js` | Regras de autenticação e recuperação isoladas da camada HTTP |
| SRP | `auth-service/server.js` | Controllers apenas orquestram |
| SRP | `payment-service/db.js` | Gerencia conexão do banco de pagamentos |
| SRP | `payment-service/middlewares/auth.js` | Valida JWT; não conhece regras de pagamento |
| SRP | `payment-service/repositories/packageRepository.js` | Encapsula SQL de pacotes |
| SRP | `payment-service/repositories/purchaseRepository.js` | Encapsula SQL de compras |
| SRP | `payment-service/services/paymentService.js` | Regras de pagamento isoladas |
| SRP | `payment-service/services/pixService.js` | Gera código PIX simulado |
| SRP | `payment-service/resilience/circuitBreaker.js` | Encapsula circuit breaker |
| SRP | `payment-service/messaging/publisher.js` | Publica eventos de pagamento |
| SRP | `notification-service/index.js` | Consome eventos e simula email |
| SRP | `evidence-service/db.js` | Gerencia conexão do banco de evidências |
| SRP | `evidence-service/middlewares/auth.js` | Valida JWT para rotas de evidência |
| SRP | `evidence-service/repositories/evidenceRepository.js` | Encapsula SQL de `evidence_requests` |
| SRP | `evidence-service/services/evidenceService.js` | Regras de solicitação e download de prova |
| SRP | `evidence-service/utils/zipBuilder.js` | Gera ZIP sem conhecer HTTP ou banco |
| SRP | `evidence-service/server.js` | Controllers apenas orquestram |
| OCP | `payment-service/resilience/circuitBreaker.js` | Aceita qualquer função assíncrona |
| OCP | `evidence-service/utils/zipBuilder.js` | Aceita lista de entradas sem mudar a implementação |
| ISP | `payment-service/repositories/` | Repositórios segregados por entidade |
| ISP | `evidence-service/repositories/evidenceRepository.js` | Interface pequena: criar, listar e buscar por dono |
| DIP | `auth-service/server.js` | Depende de `authService`, não de detalhes de banco/hash/JWT |
| DIP | `payment-service/services/paymentService.js` | Depende de repositórios, `pixService`, publisher e circuit breaker |
| DIP | `evidence-service/services/evidenceService.js` | Depende de repository e zipBuilder, não de `pg` ou Express |

> Ver `docs/SOLID_AUDIT.md` para análise completa por princípio.

---

## 4. Requisitos Implementados

| Requisito | Descrição | Serviço | Endpoint / Mecanismo | Status |
|-----------|-----------|---------|----------------------|--------|
| REQ01 | Cadastrar Usuário | `auth-service` | `POST /api/auth/register` | ✅ |
| REQ02 | Recuperar Senha | `auth-service` | `POST /api/auth/password/forgot` + `POST /api/auth/password/reset` | ✅ |
| REQ03 | Logar no Sistema | `auth-service` | `POST /api/auth/login` → JWT | ✅ |
| REQ04 | Sair do Sistema | Frontend | Remoção de token + redirect | ✅ |
| REQ05 | Comprar Créditos | `payment-service` | `GET /api/payments/packages` + `POST /api/payments/checkout` | ✅ |
| REQ06 | Efetuar Pagamento | `payment-service` | PIX via `pixService`; circuit breaker via `opossum` | ✅ |
| REQ07 | Confirmar por email | `notification-service` | Fila `payment.confirmed` → log `[EMAIL]` | ✅ |
| REQ08 | Criar solicitação de prova | `evidence-service` | `POST /api/evidence/requests` | ✅ |
| REQ09 | Listar solicitações de prova | `evidence-service` | `GET /api/evidence/requests` | ✅ |
| REQ10 | Consultar detalhe de prova | `evidence-service` | `GET /api/evidence/requests/:id` | ✅ |
| REQ11 | Captura real de mídia | — | Fora do escopo atual | ❌ |
| REQ12 | Processamento avançado | — | Fora do escopo atual | ❌ |
| REQ13 | Relatório completo | — | Fora do escopo atual | ❌ |
| REQ14 | Funcionalidade avançada de captura/relatório | — | Fora do escopo atual | ❌ |
| REQ15 | Baixar ZIP final | `evidence-service` | `GET /api/evidence/requests/:id/download` | ✅ |

**Taxa de entrega: 11/15 = 73,3%**

---

## 5. ADRs Produzidas

| ADR | Decisão | Status |
|-----|---------|--------|
| ADR-0001 | Estilo arquitetural: microsserviços com broker assíncrono | ✅ Documentada |
| ADR-0002 | Comunicação: REST síncrono + fila assíncrona | ✅ Documentada |
| ADR-0003 | Message broker: RabbitMQ | ✅ Documentada |
| ADR-0004 | Resiliência: retry, DLQ e circuit breaker | ✅ Documentada |
| ADR-0005 | Autenticação: JWT stateless por serviço | ✅ Documentada |
| ADR-0006 | Desvios arquiteturais documentados | ✅ Documentada |

> Ver `docs/ADRs/` para os arquivos completos.

---

## 6. Como Validar Rapidamente

Ver [docs/COMO_RODAR_WINDOWS.md](COMO_RODAR_WINDOWS.md) para comandos PowerShell que exercitam:

- cadastro e login;
- recuperação de senha;
- catálogo de pacotes, checkout, PIX e notificação via RabbitMQ;
- criação, listagem e detalhe de prova;
- download do ZIP simulado.

Validação Docker executada em 2026-06-30:

| Item | Resultado |
|------|-----------|
| Containers | 9 containers `Up`; RabbitMQ `healthy` |
| Frontend | `http://localhost`, `login.html`, `cadastro.html`, `creditos.html` e `checkout.html` responderam HTTP 200 |
| REQ01-REQ10 e REQ15 | Validados por chamadas HTTP reais pelo gateway |
| REQ07 | Confirmado por log real do `notification-service` consumindo `payment.confirmed` |
| REQ11-REQ14 | Permanecem fora do escopo atual |
