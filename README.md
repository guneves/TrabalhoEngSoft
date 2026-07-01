# Veridit — Plataforma de Captura de Provas Digitais

Trabalho III — Engenharia de Software I (Prof. Dr. Eduardo Almeida)  
Implementação de 73,3% dos requisitos com arquitetura de microsserviços.

---

## Como Rodar

```powershell
docker compose up --build -d
```

Conferir os containers:

```powershell
docker compose ps
```

Todos os servicos devem aparecer como `Up`, e o `rabbitmq` deve aparecer como `healthy`.

Acessar no navegador:

```text
http://localhost
```

Se quiser abrir pelo PowerShell:

```powershell
start http://localhost
```

Para acompanhar logs:

```powershell
docker compose logs -f
```

Para parar:

```powershell
docker compose down
```

---

## Serviços

| Serviço | Função | Porta interna |
|---------|--------|---------------|
| gateway (nginx) | API Gateway + frontend estático | 80 (host) |
| auth-service | Autenticação, cadastro e recuperação de senha | 3001 (interno) |
| payment-service | Pacotes, checkout e PIX simulado | 3002 (interno) |
| evidence-service | Solicitações de prova/captura e ZIP final simulado | 3003 (interno) |
| notification-service | Confirmação por email (RabbitMQ) | — |
| rabbitmq | Message broker | 15672 (painel, host) |
| db_auth | PostgreSQL do auth-service | interno |
| db_payment | PostgreSQL do payment-service | interno |
| db_evidence | PostgreSQL do evidence-service | interno |

---

## Painel RabbitMQ

http://localhost:15672 — usuário: `guest` / senha: `guest`

---

## Requisitos Implementados

REQ01, REQ02, REQ03, REQ04, REQ05, REQ06, REQ07, REQ08, REQ09, REQ10, REQ15

**Total:** 11 de 15 requisitos = **73,3%**

REQ11, REQ12, REQ13 e REQ14 permanecem fora do escopo atual por exigirem captura real de midia, processamento avancado e relatorio completo.

---

## Validacao Atual

Validacao executada em Docker Compose no dia 2026-06-30:

- 9 containers ativos: gateway, 4 servicos de aplicacao, RabbitMQ e 3 bancos PostgreSQL.
- Frontend respondendo em `http://localhost`.
- RabbitMQ saudavel em `http://localhost:15672`.
- Cadastro, login, recuperacao de senha, pacotes, checkout, PIX, notificacao, prova e ZIP validados por chamadas HTTP reais.
- ZIP final validado com os arquivos `evidence-request-<id>.json` e `relatorio.txt`.

---

## Endpoints Principais

| Requisito | Endpoint / Mecanismo |
|-----------|----------------------|
| REQ01 | `POST /api/auth/register` |
| REQ02 | `POST /api/auth/password/forgot` + `POST /api/auth/password/reset` |
| REQ03 | `POST /api/auth/login` |
| REQ04 | Logout client-side removendo `veridit_token` do `localStorage` |
| REQ05 | `GET /api/payments/packages` + `POST /api/payments/checkout` |
| REQ06 | PIX simulado via `pixService` + circuit breaker no checkout |
| REQ07 | RabbitMQ: exchange `payment_events`, fila `payment.confirmed` |
| REQ08 | `POST /api/evidence/requests` |
| REQ09 | `GET /api/evidence/requests` |
| REQ10 | `GET /api/evidence/requests/:id` |
| REQ15 | `GET /api/evidence/requests/:id/download` |

---

## Documentação

- `docs/ADRs/` — Architecture Decision Records (14 ADRs + índice)
- `docs/SOLID_AUDIT.md` — Auditoria dos princípios SOLID aplicados no código
- `docs/REQUIREMENTS_SPRINT1.md` — Tabela dos requisitos entregues com endpoints
- `docs/SPRINT-RESULT.md` — Resultado detalhado de cada fase de implementação
- `docs/ESTADO_ATUAL_TRABALHO3.md` — Estado final atualizado do projeto
- `docs/COMO_RODAR_WINDOWS.md` — Roteiro de teste rápido no PowerShell
