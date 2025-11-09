# 🔧 Configurar Expo Project ID para Push Notifications

## ❌ Erro Atual:

```
⚠️ Erro ao registrar push token (não crítico): 
[Error: No "projectId" found. If "projectId" can't be inferred from the manifest (for instance, in bare workflow), you have to pass it in yourself.]
```

## 💡 O Que Significa:

O Expo precisa de um **Project ID** para gerar tokens de push notification válidos. Este ID identifica seu projeto no serviço de push do Expo.

---

## ✅ Solução 1: Criar Projeto no Expo (RECOMENDADO)

### Passo 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Passo 2: Login no Expo

```bash
eas login
```

Se não tem conta:
```bash
eas register
```

### Passo 3: Criar Projeto

```bash
cd c:\Projetos\NowCRM\NowSoftwareApp\NowSoftwaresApp
eas init
```

Isso vai:
- Criar um projeto no Expo
- Gerar um Project ID único
- Atualizar automaticamente o `app.json`

### Passo 4: Verificar

Abra `app.json` e veja:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "abc123def-4567-89gh-ijkl-mnopqrstuvwx"
      }
    }
  }
}
```

---

## ✅ Solução 2: Obter Project ID Manualmente

### Se já tem projeto Expo:

1. Acesse: https://expo.dev/
2. Faça login
3. Vá em "Projects"
4. Selecione seu projeto
5. Copie o "Project ID"
6. Cole no `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "SEU-PROJECT-ID-AQUI"
      }
    }
  }
}
```

---

## ✅ Solução 3: Desenvolvimento SEM Project ID (Temporário)

### Para testar SEM criar projeto Expo:

Edite `src/services/notificationService.ts`:

```tsx
// ANTES:
token = (await Notifications.getExpoPushTokenAsync({
  projectId: Constants.expoConfig?.extra?.eas?.projectId,
})).data;

// AGORA (temporário):
try {
  // Tenta com projectId se existir
  if (Constants.expoConfig?.extra?.eas?.projectId) {
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;
  } else {
    // Desenvolvimento: usa sem projectId (token local)
    console.warn('⚠️ Sem projectId - usando token local de desenvolvimento');
    token = (await Notifications.getExpoPushTokenAsync()).data;
  }
} catch (error) {
  console.error('Erro ao obter push token:', error);
  return null;
}
```

**⚠️ ATENÇÃO:** Tokens sem projectId só funcionam para testes locais! Para produção, você PRECISA de um projectId válido.

---

## 📋 Arquivo app.json Atualizado:

Já adicionei a estrutura no `app.json`:

```json
{
  "expo": {
    "name": "NowSoftwaresApp",
    "slug": "NowSoftwaresApp",
    // ... outras configs ...
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"  ← SUBSTITUIR
      }
    }
  }
}
```

**Substitua `"your-project-id-here"` pelo seu Project ID real!**

---

## 🎯 Comandos Completos:

### Opção A: Criar Novo Projeto

```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Navegar para pasta do app
cd c:\Projetos\NowCRM\NowSoftwareApp\NowSoftwaresApp

# 4. Inicializar projeto
eas init

# 5. Reiniciar app
npx expo start --clear
```

### Opção B: Usar Projeto Existente

```bash
# 1. Login
eas login

# 2. Link com projeto existente
cd c:\Projetos\NowCRM\NowSoftwareApp\NowSoftwaresApp
eas init --id SEU-PROJECT-ID

# 3. Reiniciar app
npx expo start --clear
```

---

## 🔍 Como Verificar Se Funcionou:

### 1. Abrir App no Celular

### 2. Fazer Login

### 3. Verificar Console:

```
✅ Push token registrado com sucesso
📱 Push Token: ExponentPushToken[xxxxxxxxxxxxxx]
```

### 4. Verificar MongoDB:

```javascript
db.users.findOne({ email: "seu@email.com" })

// Deve ter:
{
  "pushToken": "ExponentPushToken[...]"
}
```

---

## 📱 Testando Push Notifications:

### Após configurar projectId:

1. **Logout do app**
2. **Login novamente** (registra token)
3. **Criar lembrete** com push
4. **Aguardar horário** agendado
5. **Verificar notificação** no celular

---

## ⚠️ Problemas Comuns:

### Erro: "Invalid credentials"
```bash
eas logout
eas login
```

### Erro: "Project not found"
```bash
# Criar novo:
eas init

# OU usar ID específico:
eas init --id SEU-PROJECT-ID
```

### Erro: "Command not found: eas"
```bash
npm install -g eas-cli
# OU
npx eas-cli@latest login
```

---

## 🎯 Recomendação:

**Para PRODUÇÃO:** Use a **Solução 1** (criar projeto com `eas init`)

**Para TESTE rápido:** Use a **Solução 3** (sem projectId temporário)

---

## 📝 Próximos Passos:

1. ✅ Escolher uma solução acima
2. ✅ Configurar projectId
3. ✅ Reiniciar app (`npx expo start --clear`)
4. ✅ Fazer logout/login
5. ✅ Testar push notification

---

**Escolha a Solução 1 para ter push notifications funcionais! 🚀**
