# PLAN.md - Veridit | Plano e Estado Final da Implementacao

> Status: concluido e validado em Docker Compose
> Atualizado em: 2026-06-30
> Entrega: 11 de 15 requisitos = 73,3%
> Execucao: `docker compose up --build -d`
> Resultado detalhado: `docs/SPRINT-RESULT.md`

---

## Objetivo da Entrega

Entregar pelo menos 70% dos requisitos do sistema Veridit funcionando com arquitetura aderente as decisoes registradas em ADRs, execucao local via Docker Compose, documentacao de requisitos, auditoria SOLID e roteiro de validacao.

O estado final implementa 11 requisitos:

```text
REQ01, REQ02, REQ03, REQ04, REQ05, REQ06, REQ07, REQ08, REQ09, REQ10, REQ15
```

REQ11, REQ12, REQ13 e REQ14 permanecem fora do escopo funcional atual por exigirem captura real de midia, processamento avancado e relatorio forense completo.

---

## Requisitos Entregues

| Req | Descricao | Servico / Modulo | Evidencia |
|-----|-----------|------------------|-----------|
| REQ01 | Cadastrar usuario comum e advogado | `auth-service` | `POST /api/auth/register` |
| REQ02 | Recuperar senha | `auth-service` | `POST /api/auth/password/forgot` + `POST /api/auth/password/reset` |
| REQ03 | Login | `auth-service` | `POST /api/auth/login` retorna JWT |
| REQ04 | Logout | Frontend | Remove `veridit_token` do `localStorage` e redireciona |
| REQ05 | Comprar creditos / selecionar pacote | `payment-service` | `GET /api/payments/packages` + `POST /api/payments/checkout` |
| REQ06 | Pagamento PIX/QR Code | `payment-service` | `pixCode` simulado gerado no checkout |
| REQ07 | Confirmacao por email | `notification-service` + RabbitMQ | Evento `payment.confirmed` consumido e log `[EMAIL]` |
| REQ08 | Criar solicitacao de prova | `evidence-service` | `POST /api/evidence/requests` |
| REQ09 | Listar solicitacoes de prova | `evidence-service` | `GET /api/evidence/requests` filtrado por usuario |
| REQ10 | Consultar detalhe de prova | `evidence-service` | `GET /api/evidence/requests/:id` com ownership |
| REQ15 | Baixar arquivo final ZIP | `evidence-service` | `GET /api/evidence/requests/:id/download` |

---

## ADRs que Governam o Projeto

| ADR | Decisao | Cobertura principal |
|-----|---------|---------------------|
| ADR-0001 | Microsservicos + broker de eventos | Arquitetura geral |
| ADR-0002 | REST sincrono + fila assincrona | Comunicacao entre servicos |
| ADR-0003 | RabbitMQ como broker | REQ07 |
| ADR-0004 | Circuit breaker + DLQ | REQ06, REQ07 |
| ADR-0005 | JWT stateless por servico | REQ03, REQ05, REQ08-REQ10, REQ15 |
| ADR-0006 | Desvios conscientes e escopo final | REQ06, REQ07, REQ11-REQ14, REQ15 |
| ADR-0007 | PostgreSQL isolado por servico | REQ01, REQ02, REQ05, REQ08-REQ10 |
| ADR-0008 | Dominio de autenticacao | REQ01-REQ04 |
| ADR-0009 | Dominio de pagamentos | REQ05, REQ06 |
| ADR-0010 | Notificacao por evento | REQ07 |
| ADR-0011 | Dominio de evidencias | REQ08-REQ10, REQ15 |
| ADR-0012 | API Gateway nginx + frontend estatico | Ponto unico de entrada |
| ADR-0013 | Containerizacao e entrypoints | Execucao local |
| ADR-0014 | Validacao funcional | Validacao ponta a ponta |

Indice completo: `docs/ADRs/README.md`.

---

## Arquitetura Final

| Componente | Responsabilidade |
|------------|------------------|
| `gateway` | nginx: serve frontend e roteia `/api/auth`, `/api/payments`, `/api/evidence` |
| `auth-service` | Cadastro, login, recuperacao de senha e emissao JWT |
| `payment-service` | Catalogo de pacotes, checkout, PIX simulado e publicacao de evento |
| `evidence-service` | Solicitacoes de prova, listagem, detalhe e ZIP final |
| `notification-service` | Consome evento de pagamento e simula email por log |
| `rabbitmq` | Broker AMQP com exchange, fila principal e DLQ |
| `db_auth` | PostgreSQL exclusivo do auth-service |
| `db_payment` | PostgreSQL exclusivo do payment-service |
| `db_evidence` | PostgreSQL exclusivo do evidence-service |

---

## Execucao

Subir tudo:

```powershell
docker compose up --build -d
```

Verificar containers:

```powershell
docker compose ps
```

Esperado:

- 9 containers `Up`.
- `rabbitmq` com status `healthy`.
- Gateway exposto em `http://localhost`.
- Painel RabbitMQ em `http://localhost:15672` com `guest` / `guest`.

Parar:

```powershell
docker compose down
```

Recomecar com bancos limpos:

```powershell
docker compose down -v
docker compose up --build -d
```

---

## Validacao Final

Validacao executada em 2026-06-30:

| Area | Resultado |
|------|-----------|
| Frontend | `index.html`, `login.html`, `cadastro.html`, `creditos.html` e `checkout.html` responderam HTTP 200 |
| Auth | Cadastro comum, cadastro advogado, email duplicado, login, senha invalida e recuperacao de senha validados |
| Payment | 3 pacotes retornados, checkout autenticado criado, checkout sem token rejeitado, `pixCode` gerado |
| Notification | `notification-service` consumiu evento RabbitMQ e registrou log `[EMAIL]` |
| Evidence | Criacao, listagem por usuario, detalhe, isolamento entre usuarios e ZIP validados |
| ZIP | Arquivo contem `evidence-request-<id>.json` e `relatorio.txt` |

---

## Checklist de Apresentacao

```text
[ ] docker compose up --build -d sobe sem erro
[ ] docker compose ps mostra 9 containers Up
[ ] RabbitMQ aparece como healthy
[ ] http://localhost abre o frontend
[ ] Cadastro de usuario comum e advogado funciona
[ ] Login retorna JWT
[ ] Recuperacao de senha redefine a senha
[ ] GET /api/payments/packages retorna 3 pacotes
[ ] Checkout com JWT retorna purchaseId e pixCode
[ ] Log do notification-service mostra email da compra
[ ] POST /api/evidence/requests cria prova
[ ] GET /api/evidence/requests lista apenas provas do usuario
[ ] GET /api/evidence/requests/:id retorna detalhe
[ ] GET /api/evidence/requests/:id/download baixa ZIP
[ ] docs/ADRs contem 14 ADRs + README de indice
[ ] docs/SOLID_AUDIT.md esta atualizado
[ ] README.md contem instrucoes de execucao
```
