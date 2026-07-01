# ROTEIRO DE DEMONSTRAÇÃO — Veridit | Apresentação ao Vivo

> Trabalho III — Engenharia de Software I | Prof. Dr. Eduardo Almeida
> Executar este roteiro do zero antes de apresentar para garantir que tudo funciona.

---

## PRÉ-APRESENTAÇÃO — Executar com antecedência (10 min antes)

### Passo 0 — Limpeza total do ambiente

```bash
# Parar e remover TUDO: containers, volumes, redes e imagens buildadas
docker compose down -v --remove-orphans

# Confirmar que não sobrou nada rodando
docker ps -a
# Esperado: lista vazia ou apenas containers de outros projetos
```

### Passo 1 — Build e subida limpa

```bash
# Subir todos os serviços do zero
docker compose up --build -d

# Aguardar as seguintes mensagens nos logs (na ordem):
# ✅ db_auth, db_payment e db_evidence aceitando conexões
# ✅ auth-service: "PostgreSQL pronto. Aplicando migration..." → "Auth Service ativo na porta 3001"
# ✅ payment-service: "PostgreSQL pronto. Aplicando migration..." → "Payment Service ativo na porta 3002"
# ✅ evidence-service: "PostgreSQL pronto. Aplicando migration..." → "Evidence Service ativo na porta 3003"
# ✅ rabbitmq: "Server startup complete"
# ✅ notification-service: "[Notification] Conectado ao RabbitMQ"
# ✅ gateway: iniciado sem erros
```

### Passo 2 — Cadastrar usuário de demonstração

Abrir um segundo terminal e executar:

```bash
# Cadastrar advogado para a demo
curl -s -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome_completo": "Dr. Ana Silva",
    "email": "ana@veridit.com",
    "senha": "veridit2026",
    "cpf": "123.456.789-00",
    "tipo": "advogado",
    "oab_numero": "OAB/BA 98765"
  }' | python3 -m json.tool

# Esperado: { "userId": 1, "email": "ana@veridit.com", "tipo": "advogado" }
```

### Passo 3 — Confirmar que todos os containers estão saudáveis

```bash
docker compose ps
```

Esperado — todos com status `Up`:

```
NAME                    STATUS
gateway                 Up (port 80)
auth-service            Up
payment-service         Up
notification-service    Up
rabbitmq                Up (ports 5672, 15672)
db_auth                 Up
db_payment              Up
db_evidence             Up
```

### Passo 4 — Deixar aberto antes de apresentar

Deixar visível no computador:

- **Terminal 1:** `docker compose logs -f notification-service` rodando
- **Terminal 2:** pronto para digitar comandos
- **Browser aba 1:** `http://localhost/login.html`
- **Browser aba 2:** `http://localhost:15672` (painel RabbitMQ — login: `guest` / `guest`)

---

## DEMONSTRAÇÃO AO VIVO — Passo a Passo

---

### DEMO 1 — Sistema rodando (critério: o sistema deve estar rodando)

**O que mostrar:** painel do Docker ou terminal com os 9 containers ativos.

```bash
docker compose ps
```

**:**

> "O sistema sobe com um único comando — docker compose up --build -d.
> São 9 containers: gateway, auth-service, payment-service, evidence-service,
> notification-service, RabbitMQ, db_auth, db_payment e db_evidence.
> Tudo acessível via http://localhost — porta 80."

---

### DEMO 2 — Cadastro de usuário (REQ01)

**Onde:** `http://localhost/cadastro.html`

**O que fazer:**

1. Selecionar tipo **Advogado**
2. Preencher os campos:

```
Nome completo : Dr. Carlos Mendes
Email         : carlos@oab.com
CPF           : 987.654.321-00
Número OAB    : OAB/BA 11111
Senha         : demo2026
```

3. Clicar em **Cadastrar**
4. Mostrar o retorno: `201 — Usuário cadastrado com sucesso`

**:**

> "O sistema distingue dois tipos de usuário — advogados precisam informar
> o número da OAB, usuários comuns não. A validação por tipo está no
> authService, a persistência no userRepository — princípio SRP aplicado."

---

### DEMO 3 — Login (REQ03)

**Onde:** `http://localhost/login.html`

**Credenciais para usar:**

```
Email : ana@veridit.com
Senha : veridit2026
```

**O que fazer:**

1. Preencher email e senha
2. Clicar em **Entrar**
3. Abrir DevTools → Application → Local Storage → `http://localhost`
4. Mostrar o `veridit_token` salvo

**:**

> "O login retorna um JWT com payload userId, email e tipo —
> expiração de 8 horas. O token fica no localStorage do browser.
> Nenhum estado de sessão é guardado no servidor — isso é o
> JWT stateless da ADR-0005."

Decodificar o token ao vivo em `https://jwt.io` e mostrar o payload:

```json
{
  "userId": 1,
  "email": "ana@veridit.com",
  "tipo": "advogado"
}
```

---

### DEMO 4 — Catálogo e Compra de Créditos (REQ05 + REQ06)

**Onde:** `http://localhost/creditos.html`

**O que fazer:**

1. Mostrar os 3 pacotes carregados do banco (Básico, Médio, Premium)
2. Clicar em **Selecionar** no pacote **Médio**
3. Preencher o checkout:

```
Nome completo : Dr. Ana Silva
CPF           : 123.456.789-00
```

4. Marcar "Aceito os termos"
5. Clicar **Continuar** → **Finalizar Compra**
6. Mostrar o `pixCode` exibido na tela

**:**

> "O checkout chama o backend com o JWT no header Authorization.
> O payment-service valida o token localmente — sem chamar o auth-service.
> O pixCode é gerado pelo pixService, isolado por SRP,
> substituível por integração real sem alterar o paymentService — OCP."

---

### DEMO 5 — Mensageria assíncrona (REQ07)

**O que mostrar:**

**Terminal com logs do notification-service:**

```bash
docker compose logs -f notification-service
```

Após o checkout do passo anterior, a linha já deve ter aparecido:

```
[EMAIL] Enviando confirmação para ana@veridit.com — compra 1
```

**Painel do RabbitMQ** — `http://localhost:15672`:

1. Aba **Exchanges** → mostrar `payment_events` (direct, durable)
2. Aba **Queues** → mostrar `payment.confirmed` e `payment.confirmed.dlq`
3. Mostrar que `payment.confirmed` tem 0 mensagens pendentes (já consumida)

**:**

> "Após o checkout, o payment-service publica uma mensagem no RabbitMQ.
> O notification-service consome de forma assíncrona — o usuário não espera.
> A DLQ existe para mensagens que falham no processamento — ADR-0003."

---

### DEMO 6 — Circuit Breaker (ADR-0004)

**O que fazer:**

```bash
# Derrubar o banco de pagamentos
docker compose stop db_payment
```

Voltar ao browser, tentar fazer um novo checkout.

**Resultado esperado:** mensagem de erro em menos de 3 segundos.

Mostrar os logs do payment-service:

```bash
docker compose logs -f payment-service
```

Esperado nos logs:

```
[CircuitBreaker] ABERTO — chamadas bloqueadas
```

**Restaurar e aguardar:**

```bash
docker compose start db_payment
sleep 12
```

Tentar checkout novamente — deve funcionar. Logs:

```
[CircuitBreaker] SEMI-ABERTO — testando...
[CircuitBreaker] FECHADO — operação normalizada
```

**:**

> "O circuit breaker via opossum protege o sistema quando o banco cai.
> Em vez de travar esperando timeout, retorna 503 em menos de 3 segundos.
> Após o resetTimeout de 10 segundos, testa a recuperação automaticamente.
> Isso atende à tática de Confiabilidade da ADR-0001 do Grupo 2."

---

### DEMO 7 — Recuperação de Senha (REQ02)

**O que fazer:**

```bash
curl -s -X POST http://localhost/api/auth/password/forgot \
  -H "Content-Type: application/json" \
  -d '{ "email": "ana@veridit.com" }' | python3 -m json.tool
```

Copiar o `resetToken` retornado e executar:

```bash
curl -s -X POST http://localhost/api/auth/password/reset \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<RESET_TOKEN>",
    "novaSenha": "novaSenha2026"
  }' | python3 -m json.tool
```

**Fala:**

> "A recuperação de senha usa token temporário com hash SHA-256 no banco.
> O envio de email está simulado no log do auth-service, suficiente para demonstrar
> o fluxo sem depender de SMTP externo."

---

### DEMO 8 — Evidências e ZIP Final (REQ08, REQ09, REQ10, REQ15)

**Pré-requisito:** usar um JWT válido do login.

```bash
TOKEN="<JWT_DO_LOGIN>"
```

Criar solicitação de prova:

```bash
curl -s -X POST http://localhost/api/evidence/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "titulo": "Captura de conversa",
    "descricao": "Solicitacao inicial para demonstracao",
    "tipo": "web",
    "url": "https://exemplo.com/conversa",
    "metadata": { "origem": "demo" }
  }' | python3 -m json.tool
```

Listar e detalhar:

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/evidence/requests | python3 -m json.tool
curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/evidence/requests/1 | python3 -m json.tool
```

Baixar ZIP:

```bash
curl -L -H "Authorization: Bearer $TOKEN" \
  http://localhost/api/evidence/requests/1/download \
  -o prova-simulada.zip
```

**Fala:**

> "O evidence-service cria, lista e detalha solicitações de prova por usuário.
> O download gera um ZIP simulado contendo JSON da solicitação e relatório textual,
> o que cobre o requisito de arquivo final sem implementar captura real de mídia."

---

### DEMO 9 — Logout (REQ04)

**Onde:** `http://localhost/creditos.html`

**O que fazer:**

1. Clicar no botão **Sair**
2. Mostrar que redireciona para `login.html`
3. Abrir DevTools → Local Storage → mostrar que `veridit_token` foi removido

**:**

> "Logout sem endpoint de backend — por decisão da ADR-0005.
> Como o JWT é stateless, a solução correta é remover o token do cliente.
> Criar uma blacklist no servidor introduziria estado e violaria a arquitetura."

---

### DEMO 10 — Repositório (critério: README + GitHub)

**Onde:** abrir o repositório no GitHub

Mostrar:

- `README.md` com instruções de execução
- Pasta `docs/ADRs/` com as 14 ADRs e o índice
- `docs/SOLID_AUDIT.md`
- `docs/REQUIREMENTS_SPRINT1.md`

**:**

> "Toda a documentação está na pasta docs.
> As 14 ADRs documentam as decisões arquiteturais e de implementação dos requisitos entregues.
> O SOLID_AUDIT rastreia cada princípio aplicado até o arquivo e a função."

---

## PLANO B — Se algo der errado

| Problema             | Solução                                                           |
| -------------------- | ----------------------------------------------------------------- |
| Container não sobe   | `docker compose down -v && docker compose up --build -d`          |
| Migration falha      | `docker compose restart auth-service` ou `payment-service`        |
| Login retorna 401    | Recriar usuário: executar o curl do Passo 2 novamente             |
| RabbitMQ não conecta | `docker compose restart notification-service`                     |
| Porta 80 em uso      | `sudo lsof -i :80` → encerrar o processo que ocupa a porta        |
| pixCode não aparece  | Verificar se o token está no localStorage — fazer login novamente |

---

## CHECKLIST FINAL (conferir 5 minutos antes)

```
[ ] docker compose ps → 9 containers Up
[ ] http://localhost/login.html → página carrega
[ ] http://localhost:15672 → painel RabbitMQ abre (guest/guest)
[ ] Login com ana@veridit.com / veridit2026 → token no localStorage
[ ] GET http://localhost/api/payments/packages → 3 pacotes retornados
[ ] POST http://localhost/api/auth/password/forgot → token temporário retornado
[ ] POST http://localhost/api/evidence/requests → solicitação de prova criada
[ ] GET http://localhost/api/evidence/requests/1/download → ZIP baixado
[ ] Terminal com docker compose logs -f notification-service aberto
[ ] Repositório GitHub aberto no browser
[ ] jwt.io aberto no browser para decodificar o token ao vivo
```
