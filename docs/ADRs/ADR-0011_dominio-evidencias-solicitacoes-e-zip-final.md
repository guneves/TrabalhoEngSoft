# Dominio de Evidencias: Solicitacoes e ZIP Final

## Context and Problem Statement

REQ08, REQ09, REQ10 e REQ15 exigem criar solicitacoes de captura/prova, listar solicitacoes do usuario, consultar detalhe e baixar arquivo final. A captura real de midia e o processamento forense completo ficaram fora do escopo, mas o sistema precisa demonstrar o contrato funcional desses requisitos.

## Requirements Covered

- REQ08: criar solicitacao de captura/prova.
- REQ09: listar minhas solicitacoes de prova.
- REQ10: consultar detalhe de solicitacao de prova.
- REQ15: baixar arquivo final em ZIP.

## Considered Options

* Implementar captura real de midia - mais fiel ao dominio, mas exige ferramentas externas e pipeline robusto.
* Guardar somente metadados e nao gerar arquivo - cobre parcialmente, mas nao atende REQ15.
* Guardar solicitacoes e gerar ZIP simulado - cobre o fluxo de usuario e o contrato de download.

## Decision Outcome

Chosen option: "Guardar solicitacoes e gerar ZIP simulado", because permite validar o fluxo completo sem depender de captura real. O `evidence-service` persiste solicitacoes em `evidence_requests`, filtra sempre por `userId` do JWT e gera ZIP em memoria com `zipBuilder`.

Decisoes detalhadas:

- Todas as rotas de evidencia exigem JWT.
- Criacao aceita aliases de payload (`title`/`titulo`, `targetUrl`/`url`, `evidenceType`/`tipo`).
- `title` e obrigatorio.
- `metadata` deve ser objeto JSON.
- Listagem e detalhe sao filtrados por usuario autenticado.
- Outro usuario recebe HTTP 404 ao tentar acessar prova que nao possui.
- ZIP contem `evidence-request-<id>.json` e `relatorio.txt`.

### Consequences

* Good, because o fluxo de evidencia e demonstravel sem infraestrutura externa.
* Good, because o ownership por JWT evita vazamento entre usuarios.
* Bad, because o ZIP nao contem midia real capturada.
* Bad, because cadeia de custodia forense real permanece fora do escopo.

## Evidence

- `evidence-service/server.js`
- `evidence-service/services/evidenceService.js`
- `evidence-service/repositories/evidenceRepository.js`
- `evidence-service/middlewares/auth.js`
- `evidence-service/utils/zipBuilder.js`
- `evidence-service/migrations/001_create_evidence_requests.sql`

