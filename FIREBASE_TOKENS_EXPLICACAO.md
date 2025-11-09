# 🔐 Firebase e Tokens - Guia Completo

## ❓ Preciso criar algo no Firebase?

### Resposta Curta: **NÃO!** ❌

Você está usando **Expo Push Notifications**, que funciona completamente independente do Firebase.

## 🔄 Como Funciona o Sistema Atual

### 1. **Geração de Token (Automática)**
```
App abre → Expo SDK gera token → ExponentPushToken[xxxxxx]
```

**Onde acontece:**
- `src/contexts/AuthContext.tsx` (linhas 62-66)
- Função: `notificationService.registerForPushNotificationsAsync()`

**Código:**
```typescript
const pushToken = await notificationService.registerForPushNotificationsAsync();
if (pushToken && loggedUser._id) {
  await apiService.updatePushToken(loggedUser._id, pushToken);
  console.log('✅ Push token registrado com sucesso');
}
```

### 2. **Salvamento no Backend (Automático)**
```
Token gerado → Enviado para API → Salvo no MongoDB
```

**Endpoint usado:**
- `POST /api/updatePushToken`
- Body: `{ userId, pushToken }`

**Banco de dados:**
```javascript
// MongoDB - Collection: users
{
  _id: "123...",
  email: "user@example.com",
  pushToken: "ExponentPushToken[xxxxxx]" ← Salvo aqui!
}
```

### 3. **Uso para Notificações**
```
Schedule criado → Cron Job executa → Busca pushToken do user → Envia via Expo API
```

## 📍 Onde os Tokens São Gerenciados

### **No App Mobile:**

| Arquivo | Função | O que faz |
|---------|--------|-----------|
| `src/services/notificationService.ts` | `registerForPushNotificationsAsync()` | Solicita permissão e obtém token |
| `src/contexts/AuthContext.tsx` | `login()` | Registra token após login |
| `src/services/api.ts` | `updatePushToken()` | Envia token para API |

### **No Backend:**

| Arquivo | Função | O que faz |
|---------|--------|-----------|
| `Models/Users/Users.model.js` | Campo `pushToken` | Armazena token do usuário |
| `server.js` | `POST /api/updatePushToken` | Endpoint para salvar token |
| `services/ExpoPushNotificationService.js` | `sendPushNotification()` | Usa token para enviar notificação |

## 🔍 Como Verificar Seus Tokens

### 1. **Ver Token no Console do App:**
```
📱 Push Token: ExponentPushToken[xxxxxxxxxxxxxx]
✅ Push token registrado com sucesso
```

### 2. **Ver Token no MongoDB:**
```javascript
// MongoDB Compass ou Terminal
db.users.findOne(
  { email: "seu@email.com" },
  { pushToken: 1, email: 1, firstName: 1 }
)

// Resultado esperado:
{
  "_id": "...",
  "email": "seu@email.com", 
  "firstName": "Seu Nome",
  "pushToken": "ExponentPushToken[xxxxxx...]"
}
```

### 3. **Verificar via API:**
```bash
# Postman/Insomnia
GET https://api-now.sistemasnow.com.br/api/users/me
Authorization: Bearer SEU_TOKEN_JWT

# Response deve conter:
{
  ...
  "pushToken": "ExponentPushToken[...]"
}
```

## ⚙️ Configurações Necessárias

### **✅ O que JÁ está configurado:**

1. **Expo SDK** - Instalado no package.json
2. **expo-notifications** - Gerencia permissões e tokens
3. **AuthContext** - Registra token no login
4. **API Service** - Método updatePushToken pronto
5. **Backend** - Campo pushToken no model Users

### **❌ O que NÃO precisa:**

1. ❌ Firebase Console - Criar projeto
2. ❌ google-services.json - Arquivo de config Android
3. ❌ GoogleService-Info.plist - Arquivo de config iOS
4. ❌ Firebase Cloud Messaging - Biblioteca
5. ❌ FCM Server Key - Chave de API

## 🆚 Comparação: Expo vs Firebase

| Aspecto | Expo Push API | Firebase FCM |
|---------|---------------|--------------|
| **Setup** | ✅ Simples (já funciona) | ❌ Complexo (precisa configs) |
| **Token Format** | `ExponentPushToken[...]` | Token FCM longo |
| **Dependências** | `expo-notifications` | `firebase-admin` + configs |
| **Configuração** | Nenhuma | google-services.json, etc |
| **API** | HTTP direto | Firebase SDK |
| **Custo** | Grátis | Grátis |
| **Limite** | 600 req/s | Ilimitado |
| **Funciona com Expo?** | ✅ Sim (nativo) | ⚠️ Requer config extra |

## 🔄 Fluxo Completo (Ponta a Ponta)

```
1. USUÁRIO FAZ LOGIN
   ↓
2. App solicita permissão de notificação
   ↓
3. Expo SDK gera ExponentPushToken[...]
   ↓
4. App envia token para API
   POST /api/updatePushToken
   ↓
5. Backend salva em users.pushToken (MongoDB)
   ↓
6. USUÁRIO CRIA LEMBRETE
   ↓
7. Schedule criado com delivery_methods: ['push']
   ↓
8. CRON JOB EXECUTA (a cada minuto)
   ↓
9. Backend busca schedules agendados
   ↓
10. Para cada schedule, busca user.pushToken
    ↓
11. Envia para Expo Push API:
    POST https://exp.host/--/api/v2/push/send
    {
      to: "ExponentPushToken[...]",
      title: "Lembrete",
      body: "Você tem um lembrete!"
    }
    ↓
12. Expo entrega notificação no celular
    ↓
13. 🎉 NOTIFICAÇÃO RECEBIDA!
```

## 🔧 Troubleshooting

### Token não está sendo salvo?

**Verificar:**
1. Console do app mostra "Push token registrado"?
2. Endpoint `/api/updatePushToken` existe?
3. MongoDB permite update no campo pushToken?

**Testar manualmente:**
```javascript
// No app, após login:
import { apiService } from './services/api';
const user = await apiService.getCurrentUser();
console.log('User pushToken:', user.pushToken);
```

### Notificação não chega?

**Checklist:**
1. [ ] Token está salvo no MongoDB?
2. [ ] Schedule tem `delivery_methods: ['push']`?
3. [ ] Schedule tem status `'scheduled'`?
4. [ ] Cron job está rodando?
5. [ ] Backend usa `ExpoPushNotificationService`?
6. [ ] App tem permissão de notificação?

## 🎯 Quando Usar Firebase

Você só precisaria do Firebase se:
- ❌ Quisesse enviar de qualquer servidor (não Expo)
- ❌ Quisesse mais de 600 notificações/segundo
- ❌ Quisesse funcionalidades extras do Firebase (Analytics, etc)

**Para o seu caso atual: Expo Push API é PERFEITO!** ✅

## 📱 Visualizar Schedules nas Tasks

Agora implementado! Ao clicar em uma task você vê:
- ✅ Todas as notificações agendadas
- ✅ Status de cada uma (agendada/enviada/falhou)
- ✅ Data/hora de envio
- ✅ Métodos configurados (push, email, whatsapp)
- ✅ Mensagens de erro (se houver)
- ✅ Botão para excluir schedules pendentes

## 🔗 Links Úteis

- **Testar Token:** https://expo.dev/notifications
- **Expo Push API Docs:** https://docs.expo.dev/push-notifications/overview/
- **Formato do Token:** https://docs.expo.dev/push-notifications/push-notifications-setup/

---

## ✅ Resumo Final

1. **NÃO precisa criar nada no Firebase** ❌
2. **Tokens são gerados automaticamente** pelo Expo ✅
3. **Tokens são salvos automaticamente** no login ✅
4. **Backend usa Expo Push API** (ou deveria usar) ✅
5. **Você pode testar tokens** em https://expo.dev/notifications ✅
6. **Schedules são visíveis** em cada task ✅

**Tudo já está pronto! Só falta ajustar o backend para usar `ExpoPushNotificationService.js` em vez de Firebase.**
