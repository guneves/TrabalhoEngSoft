# Dominio de Autenticacao: Cadastro, Login, Recuperacao e Logout

## Context and Problem Statement

REQ01, REQ02, REQ03 e REQ04 formam o ciclo de autenticacao do usuario. A implementacao precisa aceitar usuarios comuns e advogados, proteger senha, emitir JWT, permitir recuperacao de senha e fazer logout sem introduzir estado de sessao no servidor.

## Requirements Covered

- REQ01: cadastrar usuario advogado e comum.
- REQ02: recuperar senha.
- REQ03: logar no sistema.
- REQ04: sair do sistema.

## Considered Options

* Senha em texto puro - simples, mas inaceitavel mesmo em entrega academica.
* Sessao server-side - permite invalidacao centralizada, mas cria estado e dependencia compartilhada.
* Bcrypt + JWT stateless + token temporario de recuperacao - protege senha, mantem servicos stateless e cobre recuperacao.

## Decision Outcome

Chosen option: "Bcrypt + JWT stateless + token temporario de recuperacao", because atende aos requisitos sem criar sessao centralizada. O `auth-service` concentra a regra de cadastro, login e recuperacao em `authService`, enquanto `server.js` apenas orquestra as rotas HTTP.

Decisoes detalhadas:

- REQ01: `tipo` deve ser `comum` ou `advogado`; `oab_numero` e obrigatorio para advogado.
- REQ01: email duplicado retorna HTTP 409.
- REQ01/REQ03: senha e armazenada com `bcrypt`.
- REQ03: login retorna JWT com `{ userId, email, tipo }` e expiracao de 8 horas.
- REQ02: token de recuperacao e aleatorio, armazenado como SHA-256, expira em 30 minutos e possui uso unico.
- REQ02: envio de email e simulado por log para evitar dependencia SMTP.
- REQ04: logout e client-side, removendo `veridit_token` do `localStorage`.

### Consequences

* Good, because o backend permanece stateless e simples de executar em Docker.
* Good, because a recuperacao de senha pode ser demonstrada sem provedor externo de email.
* Bad, because logout nao invalida um JWT ja emitido no servidor; ele apenas remove o token do cliente.
* Bad, because o token de recuperacao e retornado na resposta para fins de demonstracao academica.

## Evidence

- `auth-service/services/authService.js`
- `auth-service/repositories/userRepository.js`
- `auth-service/migrations/001_create_users.sql`
- `frontend/login.html`
- `frontend/cadastro.html`
- `frontend/creditos.html`
- `frontend/checkout.html`

