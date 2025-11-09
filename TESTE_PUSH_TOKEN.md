# 🧪 Como Testar se as Notificações Push Funcionam

## 📱 Passo 1: Pegar seu Push Token

1. **Abra o app no celular**
2. **Faça login** (ou logout/login se já estava logado)
3. **Veja no console do Metro/Expo:**
   ```
   📱 Push Token: ExponentPushToken[xxxxxxxxxxxxxx]
   ✅ Push token registrado com sucesso
   ```
4. **Copie o token completo** (incluindo `ExponentPushToken[...]`)

## 🧪 Passo 2: Testar o Token

### Opção A - Script Node.js (Rápido)

```bash
cd c:\Projetos\NowCRM\api-now-digital

node test-expo-push.js "ExponentPushToken[SEU_TOKEN_AQUI]"
```

**Se aparecer:**
```
✅ SUCESSO! Notificação enviada.
📱 A notificação deve chegar no seu celular em alguns segundos.
```

✅ **Seu token funciona!** O problema está apenas no backend.

### Opção B - Site da Expo (Mais Simples)

1. Acesse: **https://expo.dev/notifications**
2. Cole seu token no campo
3. Clique em "Send a Notification"
4. Espere 5-10 segundos

Se a notificação chegou no celular = ✅ Token OK!

## 🔍 Passo 3: Verificar se o Token Está Salvo no Backend

### Verificar via MongoDB:

```javascript
// No MongoDB Compass ou terminal
db.users.findOne(
  { email: "SEU_EMAIL@exemplo.com" },
  { pushToken: 1, firstName: 1, email: 1 }
)
```

**Deve retornar:**
```json
{
  "_id": "...",
  "firstName": "Seu Nome",
  "email": "seu@email.com",
  "pushToken": "ExponentPushToken[xxxxxxxxx]"  ← Deve ter isso!
}
```

❌ **Se pushToken está null ou vazio:**
- O app não conseguiu salvar o token
- Faça logout/login novamente
- Verifique se deu erro no console

## 📋 Passo 4: Ver Logs do Backend

```bash
pm2 logs now
```

**Procure por:**

### ✅ Quando funciona:
```
🔔 Executando lembrete de tarefa ID: 690f8909d96eebcabed80562
📤 Métodos de entrega: push
🔍 [Push] Buscando schedules pendentes...
📬 [Push] 1 schedules para processar
✅ [Push] Enviado para João: "Reunião com Cliente"
```

### ❌ Quando NÃO funciona:
```
⚠️ [Push] Usuário João não tem push token
```
↑ Se aparecer isso = Token não foi salvo no banco

```
❌ [Push] Erro ao enviar notificação: Firebase Messaging não está inicializado
```
↑ Se aparecer isso = Backend está tentando usar Firebase em vez de Expo API

## 🎯 Diagnóstico Rápido

| Teste | Resultado | Significa |
|-------|-----------|-----------|
| **Token aparece no console do app?** | ✅ Sim | App está OK |
| | ❌ Não | Problema no app - Reinstalar |
| **Token está salvo no MongoDB?** | ✅ Sim | Registro funcionou |
| | ❌ Não | API não salvou - Verificar endpoint |
| **Teste manual funciona?** | ✅ Sim | Token válido, problema é só no backend |
| | ❌ Não | Token inválido ou expirado |
| **Cron executou o schedule?** | ✅ Sim | Schedule OK |
| | ❌ Não | Verificar formato date/hour |

## 🔧 Soluções Rápidas

### Se o token NÃO está no MongoDB:

1. Verifique o endpoint no backend:
   ```bash
   # Procure por: /updatePushToken
   grep -r "updatePushToken" api-now-digital/
   ```

2. Teste manualmente via Postman/Insomnia:
   ```http
   POST https://api-now.sistemasnow.com.br/api/updatePushToken
   Authorization: Bearer SEU_TOKEN_JWT
   Content-Type: application/json

   {
     "userId": "SEU_USER_ID",
     "pushToken": "ExponentPushToken[...]"
   }
   ```

### Se o token ESTÁ no MongoDB mas notificação não chega:

1. **Backend está usando Firebase em vez de Expo API**
2. Precisa modificar `PushNotificationService.js`
3. Trocar `this.messaging.send()` por `fetch('https://exp.host/--/api/v2/push/send')`

## 📊 Checklist Final

- [ ] Token aparece no console do app
- [ ] Token está salvo no MongoDB (campo `pushToken`)
- [ ] Teste manual (script ou site) funciona
- [ ] Schedule é criado com `delivery_methods: ['push']`
- [ ] Cron job detecta e executa o schedule
- [ ] Backend envia via Expo Push API (não FCM)

## 🆘 Precisa de Ajuda?

Se depois de todos os testes:
- ✅ Token funciona manualmente
- ✅ Token está no banco
- ✅ Schedule executa
- ❌ Mas a notificação não chega

= **100% o problema é o backend tentando usar Firebase**

→ Precisa ajustar `PushNotificationService.js` para usar Expo Push API.
