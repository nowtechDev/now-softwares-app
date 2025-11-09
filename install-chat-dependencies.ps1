# Script de Instalação - Dependências do Chat

Write-Host "🚀 Instalando dependências do chat..." -ForegroundColor Cyan
Write-Host ""

# Dependências necessárias
$dependencies = @(
    "expo-document-picker",
    "expo-image-picker",
    "rn-emoji-keyboard",
    "@react-native-community/datetimepicker",
    "@react-native-picker/picker"
)

Write-Host "📦 Instalando pacotes:" -ForegroundColor Yellow
foreach ($dep in $dependencies) {
    Write-Host "  - $dep" -ForegroundColor Gray
}
Write-Host ""

# Instalar
npm install $dependencies

Write-Host ""
Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Executar: npx expo start --clear" -ForegroundColor Gray
Write-Host "  2. Testar os botões de ação" -ForegroundColor Gray
Write-Host "  3. Verificar se o input não fica cortado" -ForegroundColor Gray
Write-Host ""
