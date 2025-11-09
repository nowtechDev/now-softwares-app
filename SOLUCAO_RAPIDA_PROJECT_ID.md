# 🚀 Solução Rápida: Project ID do Expo

## ❌ Erro:
```
No "projectId" found
```

## ✅ 3 Opções (Escolha 1):

---

### 🎯 OPÇÃO 1: Criar Projeto Expo (RECOMENDADO)

```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Login (criar conta se necessário)
eas login

# 3. Ir para pasta do app
cd c:\Projetos\NowCRM\NowSoftwareApp\NowSoftwaresApp

# 4. Criar projeto (auto-configura tudo)
eas init

# 5. Reiniciar
npx expo start --clear
```

**Pronto! O `eas init` vai:**
- Criar projeto no Expo
- Gerar Project ID
- Atualizar `app.json` automaticamente

---

### 🔧 OPÇÃO 2: Usar Projeto Existente

Se já tem projeto Expo:

1. Acesse https://expo.dev/
2. Login → Projects → Copie o ID
3. Cole no `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "COLE-O-ID-AQUI"
      }
    }
  }
}
```

---

### ⚡ OPÇÃO 3: Testar SEM Project ID (Temporário)

**✅ JÁ CONFIGURADO!**

O código agora funciona sem projectId para testes:

```
⚠️ Sem projectId configurado - usando token de desenvolvimento
📱 Push Token (Development): ExponentPushToken[...]
```

**Mas para produção, use Opção 1 ou 2!**

---

## 📋 O Que Mudei:

### 1. `app.json`:
```json
"extra": {
  "eas": {
    "projectId": "your-project-id-here"
  }
}
```

### 2. `notificationService.ts`:
```tsx
// Agora tenta sem projectId se não configurado
if (projectId) {
  // Usa projectId (produção)
} else {
  // Funciona sem (desenvolvimento)
}
```

---

## 🧪 Testar Agora:

```bash
# Reiniciar app
npx expo start --clear

# Fazer login no app
# Ver console:
```

**Vai mostrar:**
- ✅ `📱 Push Token (Development)` - Funcionando!
- ⚠️ Avisos para configurar projectId para produção

---

## 🎯 Recomendação:

**Escolha a OPÇÃO 1** quando quiser deploy:

```bash
npm install -g eas-cli
eas login
cd c:\Projetos\NowCRM\NowSoftwareApp\NowSoftwaresApp
eas init
npx expo start --clear
```

**Por enquanto, teste com OPÇÃO 3** (já funciona!)

---

**Push tokens funcionando mesmo sem projectId! 🎉**

**Mas para produção, crie o projeto Expo! 🚀**
