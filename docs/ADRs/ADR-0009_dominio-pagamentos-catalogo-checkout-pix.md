# Dominio de Pagamentos: Catalogo, Checkout e PIX Simulado

## Context and Problem Statement

REQ05 e REQ06 exigem compra de creditos, selecao de pacote e pagamento via PIX/QR Code. O sistema precisa demonstrar o fluxo de pagamento sem depender de provedor bancario real, credenciais externas ou rede fora do Docker Compose.

## Requirements Covered

- REQ05: comprar creditos e selecionar pacote.
- REQ06: efetuar pagamento com PIX/QR Code.

## Considered Options

* Integracao PIX real - demonstraria pagamento real, mas exige provedor, credenciais e ambiente externo.
* Checkout totalmente no frontend - simples, mas nao valida backend, persistencia ou mensageria.
* Checkout backend com PIX simulado - persiste compra, gera codigo demonstravel e publica evento.

## Decision Outcome

Chosen option: "Checkout backend com PIX simulado", because entrega o fluxo funcional exigido sem dependencias externas. O `payment-service` mantem o catalogo de tres pacotes em `credit_packages`, cria compras em `purchases`, gera `pixCode` no `pixService` e publica evento para notificacao.

Decisoes detalhadas:

- Catalogo publico em `GET /api/payments/packages`.
- Checkout protegido por JWT em `POST /api/payments/checkout`.
- Pacotes seedados por migration: Basico, Medio e Premium.
- Compra criada com status inicial `pending`.
- `pixCode` simulado com prefixo `PIX`, valor e timestamp.
- Circuit breaker via `opossum` envolve a criacao de compra para demonstrar resiliencia.
- Consulta de compra em `GET /api/payments/purchases/:id` valida ownership pelo `userId` do JWT.

### Consequences

* Good, because o fluxo completo e validavel por HTTP e aparece no banco `db_payment`.
* Good, because a ausencia de provedor PIX real nao bloqueia a demonstracao.
* Bad, because o `pixCode` nao e pagavel em ambiente real.
* Bad, because nao existe conciliacao bancaria real nem confirmacao externa do pagamento.

## Evidence

- `payment-service/server.js`
- `payment-service/services/paymentService.js`
- `payment-service/services/pixService.js`
- `payment-service/repositories/packageRepository.js`
- `payment-service/repositories/purchaseRepository.js`
- `payment-service/migrations/001_create_tables.sql`
- `payment-service/resilience/circuitBreaker.js`
- `frontend/creditos.html`
- `frontend/checkout.html`

