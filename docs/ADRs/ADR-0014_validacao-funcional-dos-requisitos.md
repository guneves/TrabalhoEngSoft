# Validacao Funcional dos Requisitos Entregues

## Context and Problem Statement

A entrega precisa demonstrar que os requisitos implementados funcionam, nao apenas que o codigo existe. Como o projeto e composto por varios containers e integra banco, gateway e broker, a validacao deve exercitar chamadas reais pelo `http://localhost`, alem de checar logs do consumidor RabbitMQ.

## Requirements Covered

- REQ01, REQ02, REQ03, REQ04, REQ05, REQ06, REQ07, REQ08, REQ09, REQ10 e REQ15.

## Considered Options

* Validar apenas por leitura de codigo.
* Criar suite automatizada completa de testes end-to-end.
* Usar roteiro de validacao PowerShell com chamadas HTTP reais e verificacao de logs.

## Decision Outcome

Chosen option: "Roteiro de validacao PowerShell com chamadas HTTP reais", because e rapido, transparente para apresentacao e valida o sistema integrado pelo mesmo caminho usado pelo usuario. A validacao atual exercita:

- Frontend: `http://localhost`, `login.html`, `cadastro.html`, `creditos.html`, `checkout.html`.
- Auth: cadastro comum, cadastro advogado, duplicidade, login valido, login invalido, recuperacao de senha.
- Payment: listagem de pacotes, checkout autenticado, PIX, consulta de compra e bloqueio sem token.
- Notification: log real do `notification-service` apos evento RabbitMQ.
- Evidence: criacao, validacao de payload, listagem por usuario, detalhe, isolamento entre usuarios e download ZIP.

### Consequences

* Good, because a validacao prova integracao real entre gateway, servicos, bancos e RabbitMQ.
* Good, because o roteiro pode ser repetido antes da apresentacao.
* Bad, because nao substitui uma suite de testes automatizados versionada com asserts permanentes.
* Bad, because dados persistidos em volumes podem interferir em demos se emails fixos forem reutilizados.

## Evidence

- `docs/COMO_RODAR_WINDOWS.md`
- `ROTEIRO_DEMO.md`
- `docs/REQUIREMENTS_SPRINT1.md`
- Logs do `notification-service`
