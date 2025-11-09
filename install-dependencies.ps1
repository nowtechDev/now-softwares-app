# Script de Instalação - Dependências do Chat

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Instalando Dependências do Chat" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na pasta correta
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na pasta NowSoftwaresApp!" -ForegroundColor Red
    Write-Host "Caminho correto: c:\Projetos\NowCRM\NowSoftwareApp\NowSoftwaresApp" -ForegroundColor Yellow
    exit 1
}

Write-Host "Instalando dependências..." -ForegroundColor Yellow
Write-Host ""

# Instalar dependências
Write-Host "1/5 - Instalando expo-av (player de áudio)..." -ForegroundColor Green
npm install expo-av

Write-Host ""
Write-Host "2/5 - Instalando expo-video (player de vídeo)..." -ForegroundColor Green
npm install expo-video

Write-Host ""
Write-Host "3/5 - Instalando react-native-webview (visualizador de documentos)..." -ForegroundColor Green
npm install react-native-webview

Write-Host ""
Write-Host "4/5 - Instalando expo-file-system (download de arquivos)..." -ForegroundColor Green
npm install expo-file-system

Write-Host ""
Write-Host "5/5 - Instalando expo-sharing (compartilhar arquivos)..." -ForegroundColor Green
npm install expo-sharing

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Instalação Concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Dependências instaladas:" -ForegroundColor Yellow
Write-Host "  ✓ expo-av (áudio)" -ForegroundColor Green
Write-Host "  ✓ expo-video (vídeo)" -ForegroundColor Green
Write-Host "  ✓ react-native-webview (documentos)" -ForegroundColor Green
Write-Host "  ✓ expo-file-system (download)" -ForegroundColor Green
Write-Host "  ✓ expo-sharing (compartilhar)" -ForegroundColor Green
Write-Host ""

Write-Host "Próximo passo:" -ForegroundColor Yellow
Write-Host "  npx expo start --clear" -ForegroundColor Cyan
Write-Host ""
