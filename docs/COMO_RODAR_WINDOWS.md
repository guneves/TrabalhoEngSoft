# Como rodar e testar no Windows

## Requisitos adicionados

- REQ02: recuperar senha com token temporario e email simulado no log do `auth-service`.
- REQ08: criar solicitacao de captura/prova em `POST /api/evidence/requests`.
- REQ09: listar minhas solicitacoes em `GET /api/evidence/requests`.
- REQ10: consultar detalhe em `GET /api/evidence/requests/:id`.
- REQ15: baixar ZIP final simulado em `GET /api/evidence/requests/:id/download`.

## Subir a aplicacao

No PowerShell, dentro da pasta do projeto:

```powershell
docker compose up --build -d
```

Confira se todos os containers subiram:

```powershell
docker compose ps
```

Todos devem aparecer como `Up`; o `rabbitmq` deve aparecer como `healthy`.

A aplicacao fica disponivel no navegador em:

```text
http://localhost
```

Se quiser abrir pelo PowerShell:

```powershell
start http://localhost
```

O painel do RabbitMQ fica em:

```text
http://localhost:15672
usuario: guest
senha: guest
```

## Teste rapido via PowerShell

Abra outro PowerShell e execute:

```powershell
$base = "http://localhost"

$cadastro = @{
  nome_completo = "Usuario Teste"
  email = "teste@example.com"
  senha = "123456"
  cpf = "12345678901"
  tipo = "comum"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType "application/json" -Body $cadastro

$login = @{
  email = "teste@example.com"
  senha = "123456"
} | ConvertTo-Json

$auth = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" -Body $login
$token = $auth.token
$headers = @{ Authorization = "Bearer $token" }
```

Crie, liste, detalhe e baixe uma prova simulada:

```powershell
$body = @{
  titulo = "Captura de conversa"
  descricao = "Solicitacao inicial para demonstracao"
  tipo = "web"
  url = "https://exemplo.com/conversa"
  metadata = @{ origem = "demo" }
} | ConvertTo-Json

$prova = Invoke-RestMethod -Method Post -Uri "$base/api/evidence/requests" -Headers $headers -ContentType "application/json" -Body $body
Invoke-RestMethod -Method Get -Uri "$base/api/evidence/requests" -Headers $headers
Invoke-RestMethod -Method Get -Uri "$base/api/evidence/requests/$($prova.id)" -Headers $headers
Invoke-WebRequest -Method Get -Uri "$base/api/evidence/requests/$($prova.id)/download" -Headers $headers -OutFile ".\prova-simulada.zip"
```

Teste recuperacao de senha:

```powershell
$forgot = @{ email = "teste@example.com" } | ConvertTo-Json
$reset = Invoke-RestMethod -Method Post -Uri "$base/api/auth/password/forgot" -ContentType "application/json" -Body $forgot

$resetBody = @{
  token = $reset.resetToken
  novaSenha = "novaSenha123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "$base/api/auth/password/reset" -ContentType "application/json" -Body $resetBody
```

Observacao: o token tambem aparece no log do container `auth-service`, simulando o envio por email.

Teste pacotes, checkout, PIX e notificacao:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/api/payments/packages"

$checkout = @{
  packageId = 1
  billingData = @{
    nome = "Usuario Teste"
    cpf = "12345678901"
    email = "teste@example.com"
  }
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "$base/api/payments/checkout" -Headers $headers -ContentType "application/json" -Body $checkout
docker compose logs --tail=80 notification-service
```

O log deve mostrar uma linha no formato:

```text
[EMAIL] Enviando confirmação para teste@example.com — compra <id>
```

## Parar a aplicacao

```powershell
docker compose down
```

Para apagar tambem os bancos/volumes e recomecar limpo:

```powershell
docker compose down -v
```
