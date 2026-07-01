# Desvios Arquiteturais Conscientes da Entrega Final

## Context and Problem Statement

A especificação original e as ADRs do Grupo 2 projetam uma plataforma completa de captura e processamento de provas digitais. A entrega final do Trabalho III implementa 11 de 15 requisitos (73,3%) com microsserviços, API Gateway, bancos separados, RabbitMQ, DLQ, circuit breaker e autenticação JWT. Esta ADR registra os desvios que permanecem conscientemente no estado final validado em Docker.

## Considered Options

* Implementar captura real de mídia, processamento avançado e relatório forense completo antes da apresentação.
* Entregar os 70%+ exigidos com fluxos funcionais e documentar claramente as limitações restantes.
* Ocultar limitações e apresentar funcionalidades simuladas como integrações reais.

## Decision Outcome

Chosen option: "Entregar os 70%+ exigidos com fluxos funcionais e documentar claramente as limitações restantes", because o objetivo avaliativo é demonstrar 70% dos requisitos funcionando com arquitetura coerente. A versão atual foi validada em Docker Compose com frontend, gateway, autenticação, pagamentos, mensageria, evidências e ZIP final simulado.

### Consequences

* Good, because o sistema executa ponta a ponta localmente com `docker compose up --build -d` e demonstra as principais táticas arquiteturais exigidas.
* Good, because os desvios restantes estão explícitos e não comprometem os 11 requisitos implementados.
* Bad, because REQ11, REQ12, REQ13 e REQ14 continuam fora do escopo funcional desta entrega.

---

## Desvio 1 - Captura real de mídia fora do escopo

**Requisitos afetados:** REQ11-REQ14.

**O que foi implementado:** O `evidence-service` cria, lista, detalha e gera ZIP final simulado para solicitações de prova.

**O que ficou fora:** Captura automatizada real de mídia, coleta forense, armazenamento de arquivos reais e processamento avançado.

**Justificativa:** Esses itens exigem pipeline assíncrono mais robusto, ferramentas externas de captura e regras forenses não especificadas no repositório atual.

**Impacto:** A entrega cobre o fluxo de solicitação e arquivo final simulado, mas não substitui uma cadeia de custódia forense real.

---

## Desvio 2 - PIX e email simulados

**Requisitos afetados:** REQ06 e REQ07.

**O que foi implementado:** O `payment-service` gera `pixCode` simulado e publica evento RabbitMQ; o `notification-service` consome a fila e registra o envio de email por log.

**O que ficou fora:** Integração com provedor bancário PIX e envio SMTP real.

**Justificativa:** Integrações externas adicionariam credenciais, dependências de rede e custos fora do escopo acadêmico.

**Impacto:** O fluxo arquitetural está demonstrado, incluindo mensageria e DLQ, mas os provedores reais devem ser substituídos em produção.

---

## Desvio 3 - Catálogo mantido no payment-service

**O que a arquitetura poderia exigir:** Um `catalog-service` dedicado.

**O que foi implementado:** A tabela `credit_packages` e a rota `GET /api/payments/packages` ficam no `payment-service`.

**Justificativa:** O catálogo possui apenas três pacotes estáticos e é usado diretamente no checkout. Separá-lo aumentaria containers e complexidade operacional sem ganho demonstrável para a entrega.

**Impacto:** Baixo. O contrato HTTP pode ser preservado caso o catálogo seja extraído futuramente para um serviço próprio.
