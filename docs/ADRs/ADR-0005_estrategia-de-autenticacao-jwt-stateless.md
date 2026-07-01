# JWT Stateless Validado Localmente em Cada Serviço

## Context and Problem Statement

O `auth-service` emite tokens JWT após login e os serviços protegidos precisam validar requisições autenticadas sem criar sessão centralizada. Mesmo com o API Gateway nginx como ponto único de entrada externo, `payment-service` e `evidence-service` mantêm validação local do header `Authorization` para não confiar apenas no roteamento do gateway.

## Considered Options

* JWT validado somente no API Gateway — um único ponto de verificação antes de rotear para serviços internos; os serviços internos confiam em qualquer request que chegue pelo gateway
* Sessão centralizada — serviço de sessão compartilhada (Redis/banco); todos os serviços consultam esse serviço para verificar autenticidade
* JWT stateless validado em cada serviço — cada serviço verifica a assinatura do token usando o `JWT_SECRET` compartilhado via variável de ambiente, sem chamada de rede

## Decision Outcome

Chosen option: "JWT stateless validado em cada serviço", because é compatível com serviços stateless (sem estado de sessão no servidor) conforme exigido pela ADR 002 do Grupo 2. A sessão centralizada introduziria um ponto único de falha e exigiria uma dependência de rede em toda requisição autenticada — contrário ao requisito de Confiabilidade. Com `JWT_SECRET` injetado via `process.env.JWT_SECRET` no `docker-compose.yml`, cada serviço valida o token autonomamente sem coordenação.

### Consequences

* Good, because a validação é local e sem latência de rede; um serviço pode autenticar requests mesmo que o `auth-service` esteja temporariamente indisponível, aumentando a resiliência do sistema
* Bad, because o segredo `JWT_SECRET` precisa ser compartilhado entre todos os serviços via variável de ambiente — qualquer rotação do segredo exige restart simultâneo de todos os containers; tokens emitidos antes da rotação se tornam inválidos imediatamente
