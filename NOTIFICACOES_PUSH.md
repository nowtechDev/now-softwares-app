# 🔔 Sistema de Notificações Push - Status e Configuração

## 📊 Status Atual

### ✅ O que está funcionando:
1. **App registra Push Token** - No login, o app obtém Expo Push Token e salva no backend
2. **Schedule criado corretamente** - Lembretes são agendados com `delivery_methods: ['push']`
3. **Cron Job executando** - Backend detecta schedules na hora certa

### ❌ O que precisa ser ajustado:
O backend está tentando usar **Firebase Cloud Messaging (FCM)** direto, mas com **Expo Push Tokens** você precisa usar a **API da Expo**.

## 🔧 Como Funciona com Expo

### Fluxo Correto:
```
1. App (Expo) → Obtém ExponentPushToken[...]
2. App → Salva token no backend (users.pushToken)
3. Cron Job → Detecta schedule na hora
4. Backend → Envia para API da Expo (não FCM!)
5. Expo Push Service → Entrega no dispositivo
```

## 🛠️ Correção Necessária no Backend

O arquivo `PushNotificationService.js` está usando FCM, mas deveria usar a API da Expo:

```javascript
// ❌ ATUAL (Firebase/FCM):
await this.messaging.send(message);

// ✅ CORRETO (Expo Push API):
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: user.pushToken, // ExponentPushToken[...]
    title: taskName,
    body: taskDescription,
    sound: 'default',
    priority: 'high',
    data: {
      scheduleId: schedule._id.toString(),
      taskId: schedule.related_id?.toString(),
      type: 'task_reminder',
    }
  })
});
```

## 📱 Como Verificar se Funcionou

### 1. Verificar se o Push Token foi registrado:
```bash
# No MongoDB ou via API
db.users.findOne({ _id: "SEU_USER_ID" }, { pushToken: 1 })

# Deve retornar algo como:
{ pushToken: "ExponentPushToken[xxxxxxxxxxxxxx]" }
```

### 2. Verificar logs do backend quando o cron executar:
```
✅ [Push] Enviado para [Nome]: "[Título do Lembrete]"
```

### 3. Testar manualmente (enquanto não corrige):
Use o serviço online da Expo: https://expo.dev/notifications

- Cole seu `ExponentPushToken[...]`
- Envie uma notificação teste
- Se chegar no celular = Token está OK!

## 🎯 Solução Temporária (Teste Rápido)

Enquanto não corrige o backend, você pode testar se seu token funciona:

1. **Pegue seu Push Token:**
   - Faça login no app
   - Veja no console: `📱 Push Token: ExponentPushToken[...]`

2. **Teste no site da Expo:**
   - Acesse: https://expo.dev/notifications
   - Cole o token
   - Envie uma mensagem teste

3. **Se chegou no celular:**
   - ✅ Token está OK
   - ✅ Expo está funcionando
   - ❌ Só falta corrigir o backend para usar API da Expo

## 🔍 Logs para Acompanhar

### No app mobile (console):
```
📱 Push Token: ExponentPushToken[xxxxxx]
✅ Push token registrado com sucesso
```

### No backend (pm2 logs):
```
🔔 Executando lembrete de tarefa ID: 690f...
📤 Métodos de entrega: push
⚠️ [Push] Usuário João não tem push token  ← Se aparecer isso, o token não foi salvo
✅ [Push] Enviado para João: "Reunião"      ← Sucesso!
```

## 📦 Pacotes Necessários no Backend

Para usar a API da Expo corretamente:

```bash
cd api-now-digital
npm install node-fetch
# ou use axios que já está instalado
```

## 🚀 Próximos Passos

1. ✅ **App está OK** - Já registra token corretamente
2. ⏳ **Ajustar Backend** - Trocar FCM por Expo Push API
3. ✅ **Schedules OK** - Já funcionam corretamente
4. ⏳ **Testar notificação** - Após ajuste do backend

## 💡 Alternativa: Firebase + Expo

Se quiser manter o Firebase, você precisaria:
1. Configurar Firebase Cloud Messaging no Expo
2. Adicionar google-services.json (Android) e GoogleService-Info.plist (iOS)
3. Usar `expo-notifications` com FCM em vez de Expo Push Service

**Mas é mais simples usar a API da Expo!** É para isso que existe.
