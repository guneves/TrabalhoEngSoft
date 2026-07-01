# SOLID_AUDIT.md — Auditoria dos Princípios SOLID

> Projeto: Veridit — Plataforma de Captura de Provas Digitais  
> Disciplina: Engenharia de Software I — Prof. Dr. Eduardo Almeida  
> Fonte: separação real de responsabilidades no código-fonte do repositório
> Atualizado em: 2026-06-30

---

## S — Single Responsibility Principle (SRP)

> Um módulo deve ter uma única razão para mudar.

| Arquivo | Função / Módulo | Aplicação do SRP |
|---------|-----------------|-----------------|
| `auth-service/db.js` | módulo inteiro | Gerencia exclusivamente a conexão com o banco de dados do serviço de autenticação. |
| `auth-service/repositories/userRepository.js` | `createUser()`, `findByEmail()` | Encapsula SQL da tabela `users`; não conhece bcrypt, JWT ou Express. |
| `auth-service/repositories/userRepository.js` | funções de reset de senha | Encapsula SQL de `password_reset_tokens` e atualização de senha. |
| `auth-service/services/authService.js` | `register()` | Regra de cadastro isolada da camada HTTP. |
| `auth-service/services/authService.js` | `login()` | Regra de login isolada da camada HTTP. |
| `auth-service/services/authService.js` | `requestPasswordReset()` | Regra de solicitação de recuperação, geração de token e expiração. |
| `auth-service/services/authService.js` | `resetPassword()` | Regra de validação do token e redefinição da senha. |
| `auth-service/server.js` | rotas `/auth/*` | Controllers apenas orquestram request, service e status HTTP. |
| `payment-service/db.js` | módulo inteiro | Gerencia exclusivamente a conexão PostgreSQL do serviço de pagamentos. |
| `payment-service/middlewares/auth.js` | `authMiddleware()` | Valida token JWT; não conhece regras de pagamento. |
| `payment-service/repositories/packageRepository.js` | `listPackages()`, `findById()` | Encapsula SQL de pacotes de crédito. |
| `payment-service/repositories/purchaseRepository.js` | `createPurchase()`, `findById()` | Encapsula SQL de compras. |
| `payment-service/services/paymentService.js` | `listPackages()`, `initiatePurchase()` | Orquestra regra de pagamento, PIX, persistência e publicação de evento. |
| `payment-service/services/pixService.js` | `generatePixCode()` | Gera código PIX simulado sem conhecer banco ou HTTP. |
| `payment-service/resilience/circuitBreaker.js` | `createCircuitBreaker()` | Encapsula configuração e eventos do circuit breaker. |
| `payment-service/messaging/publisher.js` | `publishPaymentConfirmed()` | Publica eventos de pagamento no RabbitMQ. |
| `notification-service/index.js` | módulo inteiro | Consome fila e simula envio de email; não conhece regras de pagamento. |
| `evidence-service/db.js` | módulo inteiro | Gerencia exclusivamente a conexão PostgreSQL do serviço de evidências. |
| `evidence-service/middlewares/auth.js` | `authMiddleware()` | Valida JWT para as rotas de evidência. |
| `evidence-service/repositories/evidenceRepository.js` | `create()`, `listByUser()`, `findByIdAndUser()` | Encapsula SQL de `evidence_requests`. |
| `evidence-service/services/evidenceService.js` | `createRequest()` | Valida e normaliza a criação de solicitação de prova. |
| `evidence-service/services/evidenceService.js` | `listRequests()`, `getRequest()` | Regras de listagem e ownership por usuário. |
| `evidence-service/services/evidenceService.js` | `buildDownloadZip()` | Monta o conteúdo do arquivo final simulado. |
| `evidence-service/utils/zipBuilder.js` | `createZip()` | Responsável apenas por montar um arquivo ZIP válido. |
| `evidence-service/server.js` | rotas `/evidence/*` | Controllers apenas orquestram HTTP e service. |

---

## O — Open/Closed Principle (OCP)

> Um módulo deve estar aberto para extensão e fechado para modificação.

| Arquivo | Aplicação do OCP |
|---------|-----------------|
| `payment-service/server.js` | Rotas protegidas por middleware sem reescrever a lógica de negócio. |
| `payment-service/services/paymentService.js` | Um provedor de pagamento real pode substituir o `pixService` mantendo o contrato de geração de código. |
| `payment-service/services/pixService.js` | Implementação substituível por integração real sem alterar o service consumidor. |
| `payment-service/resilience/circuitBreaker.js` | Aceita qualquer função assíncrona, não apenas criação de compra. |
| `evidence-service/utils/zipBuilder.js` | Gera ZIP a partir de uma lista genérica de entradas; novos arquivos podem ser adicionados sem mudar o algoritmo. |
| `evidence-service/services/evidenceService.js` | O download pode receber novas entradas no ZIP sem alterar controller ou repository. |

---

## L — Liskov Substitution Principle (LSP)

> Objetos de uma subclasse devem poder substituir objetos da superclasse sem alterar a correção do programa.

**Aplicação:** N/A com justificativa.

O projeto usa módulos CommonJS e funções simples, sem hierarquias de classe. Não há violação de LSP porque não há herança ou subtipos sendo substituídos. A decisão é coerente com o escopo: evitar ORM e abstrações desnecessárias.

**Aplicação futura possível:** criar contratos substituíveis para provedores de captura, canais de notificação ou geradores de relatório.

---

## I — Interface Segregation Principle (ISP)

> Clientes não devem ser forçados a depender de interfaces que não utilizam.

| Arquivo | Aplicação do ISP |
|---------|-----------------|
| `payment-service/repositories/packageRepository.js` e `purchaseRepository.js` | Repositórios segregados por entidade; o service importa apenas o que precisa. |
| `payment-service/messaging/publisher.js` | Expõe apenas `publishPaymentConfirmed`, sem acoplar consumo ou configuração de filas ao service. |
| `payment-service/middlewares/auth.js` | Expõe apenas o middleware de validação. |
| `evidence-service/repositories/evidenceRepository.js` | Interface pequena para criar, listar e buscar solicitação por usuário. |
| `evidence-service/utils/zipBuilder.js` | Expõe apenas `createZip(entries)`, sem misturar regra de domínio de evidência. |
| `auth-service/repositories/userRepository.js` | Funções de usuário e recuperação de senha estão separadas por operação, evitando uma API genérica demais. |

---

## D — Dependency Inversion Principle (DIP)

> Módulos de alto nível não devem depender diretamente de módulos de baixo nível.

| Arquivo | Aplicação do DIP |
|---------|-----------------|
| `auth-service/repositories/userRepository.js` | Depende de `db.js`, não do `pg` diretamente. |
| `auth-service/server.js` | Depende de `authService`, não de `pg`, `bcrypt`, `crypto` ou `jsonwebtoken`. |
| `auth-service/services/authService.js` | Depende de `userRepository` para persistência, não de SQL inline. |
| `payment-service/services/paymentService.js` | Depende de repositories, `pixService`, publisher e circuit breaker; não importa `pg`, `opossum` ou `amqplib` diretamente. |
| `payment-service/server.js` | Depende de `paymentService` e middleware, não dos detalhes de banco e fila. |
| `evidence-service/services/evidenceService.js` | Depende de `evidenceRepository` e `zipBuilder`; não conhece Express nem `pg`. |
| `evidence-service/server.js` | Depende de `evidenceService`, não do repository ou zipBuilder diretamente. |

---

## Resumo por Princípio

| Princípio | Status | Evidência |
|-----------|--------|-----------|
| **SRP** | ✅ Amplamente aplicado | Separação entre controllers, services, repositories, middlewares, mensageria, resiliência e utilitários |
| **OCP** | ✅ Aplicado | Middleware, circuit breaker e geração de ZIP/PIX substituíveis por extensão |
| **LSP** | ⚪ N/A | Projeto sem hierarquias de classe; não há substituição de subtipos |
| **ISP** | ✅ Aplicado | Interfaces pequenas por módulo e repositórios segregados |
| **DIP** | ✅ Aplicado | Controllers dependem de services; services dependem de repositories/utilitários, não de detalhes de infraestrutura |

---

## Arquivos Críticos Cobertos

| Domínio | Arquivos |
|---------|----------|
| Autenticação | `auth-service/server.js`, `auth-service/services/authService.js`, `auth-service/repositories/userRepository.js`, `auth-service/db.js` |
| Pagamentos | `payment-service/server.js`, `payment-service/services/paymentService.js`, `payment-service/repositories/*`, `payment-service/services/pixService.js` |
| Evidências | `evidence-service/server.js`, `evidence-service/services/evidenceService.js`, `evidence-service/repositories/evidenceRepository.js`, `evidence-service/utils/zipBuilder.js` |
| Mensageria | `payment-service/messaging/publisher.js`, `notification-service/index.js` |
| Resiliência | `payment-service/resilience/circuitBreaker.js` |
