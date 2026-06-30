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
docker compose up --build
```

Se sua instalacao usa Docker Compose antigo:

```powershell
docker-compose up --build
```

A API fica disponivel em:

```text
http://localhost
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
