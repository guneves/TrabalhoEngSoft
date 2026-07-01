# API Gateway nginx e Frontend Estatico

## Context and Problem Statement

O usuario precisa acessar o sistema por um unico endereco local, sem conhecer portas internas dos microsservicos. O frontend e composto por HTML/CSS/JS puro e deve chamar APIs por caminhos estaveis (`/api/auth`, `/api/payments`, `/api/evidence`) servidos pelo mesmo host.

## Requirements Covered

- REQ01-REQ04: telas e chamadas de autenticacao.
- REQ05-REQ07: catalogo, checkout e notificacao acionada pelo checkout.
- REQ08-REQ10: rotas de evidencia via gateway.
- REQ15: download de ZIP via gateway.

## Considered Options

* Expor cada servico diretamente ao host - simples, mas vaza topologia e exige URLs diferentes no frontend.
* Frontend com servidor Node separado - flexivel, mas adiciona outro runtime e mais um servico.
* nginx como API Gateway e servidor estatico - um container serve frontend e roteia APIs.

## Decision Outcome

Chosen option: "nginx como API Gateway e servidor estatico", because reduz a superficie externa para `http://localhost` e mantem os microsservicos acessiveis apenas na rede Docker. O `gateway/nginx.conf` roteia:

- `/api/auth/` para `auth-service:3001/auth/`
- `/api/payments/` para `payment-service:3002/payments/`
- `/api/evidence/` para `evidence-service:3003/evidence/`
- `/` para os arquivos de `frontend/`

O `frontend/index.html` redireciona para `login.html`, evitando erro 403 ao acessar a raiz.

### Consequences

* Good, because o usuario acessa apenas `http://localhost`.
* Good, because o frontend usa paths relativos e nao depende de portas internas.
* Bad, because o nginx precisa estar saudavel para qualquer acesso ao sistema.
* Bad, because configuracoes incorretas de proxy podem quebrar todos os fluxos.

## Evidence

- `gateway/nginx.conf`
- `docker-compose.yml`
- `frontend/index.html`
- `frontend/login.html`
- `frontend/cadastro.html`
- `frontend/creditos.html`
- `frontend/checkout.html`

