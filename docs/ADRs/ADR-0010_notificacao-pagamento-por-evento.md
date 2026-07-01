# Notificacao de Pagamento por Evento

## Context and Problem Statement

REQ07 exige confirmacao de pagamento por email. Enviar email dentro da requisicao de checkout aumentaria latencia e acoplaria pagamento ao canal de notificacao. O sistema precisa demonstrar mensageria assincrona e DLQ conforme as ADRs de comunicacao e resiliencia.

## Requirements Covered

- REQ07: confirmar pagamento por email.

## Considered Options

* Enviar email diretamente no `payment-service` - simples, mas acopla pagamento ao provedor de email.
* Endpoint REST entre `payment-service` e `notification-service` - separa servicos, mas continua sincrono e sensivel a falha.
* Evento RabbitMQ consumido por `notification-service` - desacopla checkout da notificacao.

## Decision Outcome

Chosen option: "Evento RabbitMQ consumido por notification-service", because o checkout pode responder ao usuario sem esperar o envio de email. O `payment-service` publica em exchange `payment_events` com routing key `payment.confirmed`, e o `notification-service` consome a fila `payment.confirmed`.

Decisoes detalhadas:

- Exchange: `payment_events`.
- Routing key: `payment.confirmed`.
- Fila principal: `payment.confirmed`.
- Fila de dead-letter: `payment.confirmed.dlq`.
- Email real substituido por log `[EMAIL]`, demonstravel no terminal.

### Consequences

* Good, because falha no envio de email nao bloqueia o checkout.
* Good, because o painel RabbitMQ permite demonstrar exchange, fila e DLQ.
* Bad, because o envio real por SMTP/provedor externo ainda nao esta implementado.
* Bad, because a consistencia e eventual: a compra pode existir antes da notificacao ser processada.

## Evidence

- `payment-service/messaging/publisher.js`
- `notification-service/index.js`
- `docker-compose.yml`
- Logs do `notification-service`

