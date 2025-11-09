# ✅ Socket - Múltiplos Formatos de Evento Corrigidos

## 🐛 Problema:

O backend envia o mesmo evento em **3 formatos diferentes**:

### **Formato 1:**
```json
{
  "client_id": "...",
  "company_id": "...",
  "message": {
    "_id": "6910c89e...",
    "text": "Olá",
    "date": "...",
    ...
  }
}
```

### **Formato 2:**
```json
{
  "_id": "6910c89e...",
  "text": "Olá",
  "date": "...",
  "client_id": "...",
  ...
}
```

### **Formato 3:**
```json
{
  "message": {
    "_id": "6910c89e...",
    ...
  }
}
```

---

## ❌ Erro Anterior:

```
❌ [ConversationScreen] Mensagem sem _id, ignorando
```

**Causa:** Código procurava `data._id`, mas no Formato 1 o `_id` está em `data.message._id`.

---

## ✅ Solução:

### **ConversationScreen:**
```typescript
// Extrair dados do formato correto
const messageData = data.message || data;
const messageId = messageData._id;

// Usar messageData e messageId em todo o código
const newMessage: Message = {
  _id: messageId,
  content: messageData.text || messageData.content || '',
  timestamp: messageData.date || messageData.timestamp,
  sender: messageData.sender || (messageData.isOpen === false ? 'client' : 'user'),
  ...
};
```

### **ChatScreen:**
```typescript
// Extrair dados do formato correto
const messageData = data.message || data;
const clientId = data.client_id;
const phone = messageData.phone || data.phone;

// Usar messageData para atualizar contato
const updatedContact = {
  ...prevConversations[contactIndex],
  lastMessage: {
    content: messageData.text || messageData.content || '[Mídia]',
    isOpen: messageData.isOpen || false,
    date: messageData.date || messageData.timestamp,
    phone_origin: messageData.phone_origin,
  },
  ...
};
```

---

## 🎯 Como Funciona:

### **1. Detectar Formato:**
```typescript
const messageData = data.message || data;
```

- Se `data.message` existe → Formato 1 ou 3
- Se não → Formato 2

### **2. Extrair ID:**
```typescript
const messageId = messageData._id;
```

- Sempre pega do lugar certo

### **3. Usar Dados:**
```typescript
messageData.text
messageData.content
messageData.date
messageData.isOpen
```

- Sempre acessa os dados corretos

---

## 📊 Logs de Sucesso:

```
📥 Evento recebido: api/chat created [{ message: { _id: "..." }, ... }]
📨 [ConversationScreen] Nova mensagem via socket
✅ [ConversationScreen] Mensagem é deste contato
📊 [ConversationScreen] Total de mensagens atuais: 26
🔍 [ConversationScreen] Mensagem já existe? false ID: 6910c89e...
🆕 [ConversationScreen] Adicionando nova mensagem...
📝 [ConversationScreen] Nova mensagem criada
✅ [ConversationScreen] Todos os IDs são únicos
✅ [ConversationScreen] Mensagem adicionada com sucesso
```

---

## ✅ Resultado:

- ✅ Funciona com Formato 1 (aninhado)
- ✅ Funciona com Formato 2 (direto)
- ✅ Funciona com Formato 3 (misto)
- ✅ Sem erros de "_id undefined"
- ✅ Mensagens aparecem corretamente

---

**Socket funcionando com todos os formatos! 🔌✅**
