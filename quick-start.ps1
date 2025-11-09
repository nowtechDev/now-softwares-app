# Script de Início Rápido - NowSoftwaresApp
# Execute este script para iniciar o app rapidamente

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     NowSoftwaresApp - Quick Start             ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na pasta correta
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script na pasta NowSoftwaresApp" -ForegroundColor Red
    Write-Host ""
    Write-Host "Use: cd c:\Projetos\NowCRM\NowSoftwareApp\NowSoftwaresApp" -ForegroundColor Yellow
    Write-Host "     .\quick-start.ps1" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "✅ Pasta correta detectada!" -ForegroundColor Green
Write-Host ""

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
        pause
        exit
    }
    Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✅ Dependências já instaladas!" -ForegroundColor Green
    Write-Host ""
}

# Menu de opções
Write-Host "Escolha uma opção:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1) Iniciar Expo (Padrão)" -ForegroundColor White
Write-Host "2) Iniciar no Android" -ForegroundColor White
Write-Host "3) Iniciar no iOS (apenas Mac)" -ForegroundColor White
Write-Host "4) Iniciar no Web" -ForegroundColor White
Write-Host "5) Limpar cache e iniciar" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Digite o número (1-5)"

Write-Host ""

switch ($choice) {
    "1" {
        Write-Host "🚀 Iniciando Expo..." -ForegroundColor Green
        Write-Host ""
        Write-Host "📱 Para testar no celular:" -ForegroundColor Yellow
        Write-Host "   1. Instale o app 'Expo Go' (Play Store/App Store)" -ForegroundColor White
        Write-Host "   2. Escaneie o QR Code que aparecerá" -ForegroundColor White
        Write-Host ""
        npm start
    }
    "2" {
        Write-Host "🤖 Iniciando no Android..." -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  Certifique-se que o emulador está rodando!" -ForegroundColor Yellow
        Write-Host ""
        npm run android
    }
    "3" {
        Write-Host "🍎 Iniciando no iOS..." -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  Funciona apenas no Mac com Xcode instalado!" -ForegroundColor Yellow
        Write-Host ""
        npm run ios
    }
    "4" {
        Write-Host "🌐 Iniciando no Web..." -ForegroundColor Green
        Write-Host ""
        npm run web
    }
    "5" {
        Write-Host "🧹 Limpando cache..." -ForegroundColor Yellow
        npx expo start -c
    }
    default {
        Write-Host "❌ Opção inválida! Iniciando Expo..." -ForegroundColor Red
        Write-Host ""
        npm start
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Para parar o servidor, pressione Ctrl+C" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
