# REQUIREMENTS_SPRINT1.md — Requisitos Entregues

> Projeto: Veridit — Plataforma de Captura de Provas Digitais  
> Disciplina: Engenharia de Software I — Prof. Dr. Eduardo Almeida  
> Meta da entrega final: pelo menos 70% dos requisitos funcionando com arquitetura de microsserviços aderente às ADRs
> Resultado atual: **73,3%** (11 de 15 requisitos entregues)
> Atualizado em: 2026-06-30

---

## Tabela de Requisitos Implementados

| Requisito | Descrição | Serviço Responsável | Endpoint / Mecanismo | Status |
|-----------|-----------|---------------------|----------------------|--------|
| REQ01 | Cadastrar Usuário (advogado e comum) | `auth-service` | `POST /api/auth/register` | ✅ Implementado |
| REQ02 | Recuperar senha | `auth-service` | `POST /api/auth/password/forgot` + `POST /api/auth/password/reset` | ✅ Implementado |
| REQ03 | Logar no Sistema | `auth-service` | `POST /api/auth/login` → JWT retornado | ✅ Implementado |
| REQ04 | Sair do Sistema | Frontend (`creditos.html` / `checkout.html`) | `localStorage.removeItem('veridit_token')` ou `localStorage.clear()` + redirect | ✅ Implementado |
| REQ05 | Comprar Créditos — selecionar pacote | `payment-service` | `GET /api/payments/packages` (catálogo público) + `POST /api/payments/checkout` (JWT obrigatório) | ✅ Implementado |
| REQ06 | Efetuar Pagamento — PIX/QR Code | `payment-service` | `POST /api/payments/checkout` → `pixCode` gerado via `pixService`; circuit breaker via `opossum` | ✅ Implementado |
| REQ07 | Confirmar pagamento por email | `notification-service` via RabbitMQ | Checkout publica em `payment_events`; `notification-service` consome `payment.confirmed` e loga confirmação | ✅ Implementado |
| REQ08 | Criar solicitação de captura/prova | `evidence-service` | `POST /api/evidence/requests` | ✅ Implementado |
| REQ09 | Listar minhas solicitações de prova | `evidence-service` | `GET /api/evidence/requests` | ✅ Implementado |
| REQ10 | Consultar detalhe de uma solicitação de prova | `evidence-service` | `GET /api/evidence/requests/:id` | ✅ Implementado |
| REQ15 | Baixar arquivo final em ZIP | `evidence-service` | `GET /api/evidence/requests/:id/download` → ZIP simulado com JSON e relatório textual | ✅ Implementado |

---

## Requisitos Fora do Escopo Atual

| Requisito | Motivo da Exclusão |
|-----------|--------------------|
| REQ11–REQ14 | Captura real de mídia, processamento avançado e relatório completo permanecem fora do escopo desta entrega; exigiriam integração com captura automatizada, armazenamento de arquivos reais e pipeline assíncrono mais robusto |

---

## Validação Funcional Atual

Validação executada com Docker Compose em 2026-06-30:

| Requisito | Evidência validada |
|-----------|--------------------|
| REQ01 | Cadastro de usuário comum, advogado e rejeição de email duplicado com HTTP 409 |
| REQ02 | Token temporário de recuperação, troca de senha, senha antiga rejeitada e senha nova aceita |
| REQ03 | Login válido retorna JWT; senha inválida retorna HTTP 401 |
| REQ04 | Logout client-side remove token e redireciona para `login.html` |
| REQ05 | `GET /api/payments/packages` retorna 3 pacotes; checkout autenticado cria compra; checkout sem token retorna HTTP 401 |
| REQ06 | Checkout retorna `pixCode` iniciado por `PIX` |
| REQ07 | `notification-service` consome evento RabbitMQ e registra log `[EMAIL]` para a compra |
| REQ08 | Criação de solicitação de prova; payload sem título retorna HTTP 400; chamada sem token retorna HTTP 401 |
| REQ09 | Listagem retorna somente solicitações do usuário autenticado |
| REQ10 | Detalhe retorna a prova do dono; outro usuário recebe HTTP 404; id inválido retorna HTTP 400 |
| REQ15 | Download retorna ZIP contendo `evidence-request-<id>.json` e `relatorio.txt` |

---

## Detalhamento dos Endpoints

### REQ01 — Cadastro de Usuário

```http
POST /api/auth/register
```

Body (usuário comum):

```json
{
  "nome_completo": "Ana Silva",
  "email": "ana@test.com",
  "senha": "123456",
  "cpf": "12345678900",
  "tipo": "comum"
}
```

Body (advogado):

```json
{
  "nome_completo": "Carlos OAB",
  "email": "carlos@oab.com",
  "senha": "senha123",
  "cpf": "98765432100",
  "tipo": "advogado",
  "oab_numero": "123456/BA"
}
```

Respostas:

```text
201 — cadastro realizado com sucesso
400 — campos obrigatórios ausentes ou tipo inválido
409 — email já cadastrado
```

### REQ02 — Recuperação de Senha

```http
POST /api/auth/password/forgot
```

Body:

```json
{ "email": "ana@test.com" }
```

Resposta 200:

```json
{
  "message": "Se o email estiver cadastrado, um link de recuperacao sera enviado.",
  "resetToken": "<token temporario>",
  "expiresAt": "2026-06-30T..."
}
```

Fluxo técnico:

- O `authService` gera um token aleatório com `crypto.randomBytes`.
- O token é persistido como SHA-256 em `password_reset_tokens`.
- O token expira em 30 minutos.
- O envio de email é simulado por log no `auth-service`.

```http
POST /api/auth/password/reset
```

Body:

```json
{
  "token": "<token temporario>",
  "novaSenha": "novaSenha123"
}
```

Respostas:

```text
200 — senha redefinida com sucesso
400 — token inválido, expirado ou senha inválida
```

### REQ03 — Login

```http
POST /api/auth/login
```

Body:

```json
{ "email": "ana@test.com", "senha": "123456" }
```

Resposta 200:

```json
{
  "token": "<JWT>",
  "user": {
    "nome_completo": "Ana Silva",
    "email": "ana@test.com",
    "tipo": "comum"
  }
}
```

Resposta 401:

```json
{ "error": "Credenciais inválidas." }
```

### REQ04 — Logout

```js
localStorage.removeItem('veridit_token');
window.location.href = 'login.html';
```

O logout é client-side por decisão da ADR-0005: os JWTs são stateless e não há sessão armazenada no backend.

### REQ05 — Catálogo de Pacotes

```http
GET /api/payments/packages
```

Resposta 200 (sem autenticação):

```json
[
  { "id": 1, "nome": "Básico", "quantidade_creditos": 10, "valor_por_credito": "5.00" },
  { "id": 2, "nome": "Médio", "quantidade_creditos": 50, "valor_por_credito": "4.00" },
  { "id": 3, "nome": "Premium", "quantidade_creditos": 150, "valor_por_credito": "3.00" }
]
```

### REQ06 — Checkout com PIX

```http
POST /api/payments/checkout
Authorization: Bearer <JWT>
```

Body:

```json
{
  "packageId": 1,
  "billingData": {
    "nome": "Ana Silva",
    "cpf": "12345678900",
    "email": "ana@test.com"
  }
}
```

Resposta 201:

```json
{
  "purchaseId": 1,
  "status": "pending",
  "pixCode": "PIX000001500002026..."
}
```

Respostas relevantes:

```text
401 — token ausente ou inválido
503 — banco de dados indisponível, circuit breaker aberto
```

### REQ07 — Confirmação por Email (RabbitMQ)

Fluxo assíncrono:

```text
1. payment-service publica em exchange 'payment_events' (direct)
   routing key: 'payment.confirmed'
   payload: { purchaseId, email, packageId }

2. notification-service consome fila 'payment.confirmed'
   Log: [EMAIL] Enviando confirmação para <email> — compra <purchaseId>

3. DLQ: mensagens que excedem TTL (5s) ou são nack'd vão para 'payment.confirmed.dlq'
```

### REQ08 — Criar Solicitação de Prova

```http
POST /api/evidence/requests
Authorization: Bearer <JWT>
```

Body:

```json
{
  "titulo": "Captura de conversa",
  "descricao": "Solicitacao inicial para demonstracao",
  "tipo": "web",
  "url": "https://exemplo.com/conversa",
  "metadata": {
    "origem": "demo"
  }
}
```

Resposta 201:

```json
{
  "id": 1,
  "user_id": 1,
  "title": "Captura de conversa",
  "description": "Solicitacao inicial para demonstracao",
  "evidence_type": "web",
  "target_url": "https://exemplo.com/conversa",
  "status": "requested",
  "metadata": { "origem": "demo" }
}
```

### REQ09 — Listar Solicitações de Prova

```http
GET /api/evidence/requests
Authorization: Bearer <JWT>
```

Resposta 200:

```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "Captura de conversa",
    "status": "requested"
  }
]
```

A listagem é filtrada pelo `userId` presente no JWT.

### REQ10 — Consultar Detalhe de Solicitação

```http
GET /api/evidence/requests/:id
Authorization: Bearer <JWT>
```

Respostas:

```text
200 — solicitação encontrada e pertencente ao usuário autenticado
400 — id inválido
404 — solicitação não encontrada para o usuário autenticado
```

### REQ15 — Baixar ZIP Final Simulado

```http
GET /api/evidence/requests/:id/download
Authorization: Bearer <JWT>
```

Resposta 200:

```text
Content-Type: application/zip
Content-Disposition: attachment; filename="evidence-request-<id>.zip"
```

Conteúdo do ZIP:

- `evidence-request-<id>.json` — snapshot JSON da solicitação.
- `relatorio.txt` — relatório textual simples com status, tipo, URL alvo e data de criação.

O ZIP é simulado: ainda não há captura real de mídia nem processamento forense completo.
