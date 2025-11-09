# Script para instalar Socket.IO Client

Write-Host "🔌 Instalando Socket.IO Client..." -ForegroundColor Cyan

# Navegar para o diretório do projeto
Set-Location -Path $PSScriptRoot

# Instalar socket.io-client
Write-Host "📦 Instalando socket.io-client..." -ForegroundColor Yellow
npm install socket.io-client@4.7.5

Write-Host ""
Write-Host "✅ Socket.IO Client instalado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar o app:" -ForegroundColor Cyan
Write-Host "  npx expo start --clear" -ForegroundColor White
