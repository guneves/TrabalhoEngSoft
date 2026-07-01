# Indice de ADRs - Veridit

Este diretorio registra as decisoes arquiteturais e de implementacao tomadas ate a entrega final validada em Docker Compose.

## Cobertura por ADR

| ADR | Decisao | Requisitos cobertos |
|-----|---------|---------------------|
| ADR-0001 | Microsservicos assistidos por broker de eventos | Base arquitetural geral |
| ADR-0002 | REST sincrono + broker assincrono | REQ03, REQ05, REQ07, REQ08-REQ10, REQ15 |
| ADR-0003 | RabbitMQ como message broker | REQ07 |
| ADR-0004 | Circuit breaker + DLQ | REQ06, REQ07 |
| ADR-0005 | JWT stateless validado em cada servico | REQ03, REQ05, REQ08-REQ10, REQ15 |
| ADR-0006 | Desvios conscientes e escopo final | REQ06, REQ07, REQ11-REQ14, REQ15 |
| ADR-0007 | Persistencia PostgreSQL isolada por servico | REQ01, REQ02, REQ05, REQ08-REQ10 |
| ADR-0008 | Dominio de autenticacao e ciclo de sessao | REQ01-REQ04 |
| ADR-0009 | Dominio de pagamentos, catalogo e PIX simulado | REQ05, REQ06 |
| ADR-0010 | Notificacao de pagamento por evento | REQ07 |
| ADR-0011 | Dominio de evidencias e ZIP final | REQ08-REQ10, REQ15 |
| ADR-0012 | API Gateway nginx e frontend estatico | REQ01-REQ10, REQ15 |
| ADR-0013 | Containerizacao, entrypoints e execucao local | Todos os requisitos implementados |
| ADR-0014 | Estrategia de validacao funcional dos requisitos | REQ01-REQ10, REQ15 |

## Status da entrega

- Requisitos implementados: REQ01, REQ02, REQ03, REQ04, REQ05, REQ06, REQ07, REQ08, REQ09, REQ10 e REQ15.
- Total: 11 de 15 requisitos = 73,3%.
- Requisitos fora do escopo funcional atual: REQ11, REQ12, REQ13 e REQ14.
