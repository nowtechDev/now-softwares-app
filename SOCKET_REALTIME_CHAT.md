# 🔌 Socket.IO - Chat em Tempo Real Implementado!

## ✅ Funcionalidade Completa:

### **Socket.IO Configurado:**
- Conexão com servidor
- Reconexão automática
- Listeners para eventos de chat
- Atualização em tempo real

---

## 🎯 Eventos Escutados:

### **Chat:**
- `api/chat created` - Nova mensagem
- `api/chat patched` - Mensagem atualizada
- `api/chat removed` - Mensagem removida

---

## 🔧 Implementação:

### **1. Serviço de Socket:**
```typescript
// src/services/socket.ts

class SocketService {
  private socket: Socket | null = null;

  connect() {
    const token = apiService.getAccessToken();
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }

  on(event: string, callback: Function) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: Function) {
    this.socket?.off(event, callback);
  }
}
```

---

## 📱 ChatScreen (Lista de Conversas):

### **Conexão:**
```typescript
useEffect(() => {
  socketService.connect();

  const handleSocketMessage = (data: any) => {
    console.log('📨 Mensagem socket recebida:', data);
    
    // Recarregar conversas
    if (activeTab === 'conversations') {
      loadConversations();
    }
  };

  const handleSocketMessageRemoved = (data: any) => {
    console.log('🗑️ Mensagem removida:', data);
    loadConversations();
  };

  // Escutar eventos
  socketService.on('api/chat created', handleSocketMessage);
  socketService.on('api/chat patched', handleSocketMessage);
  socketService.on('api/chat removed', handleSocketMessageRemoved);

  // Cleanup
  return () => {
    socketService.off('api/chat created', handleSocketMessage);
    socketService.off('api/chat patched', handleSocketMessage);
    socketService.off('api/chat removed', handleSocketMessageRemoved);
  };
}, [activeTab]);
```

---

## 💬 ConversationScreen (Mensagens):

### **Conexão:**
```typescript
useEffect(() => {
  socketService.connect();

  const handleSocketMessage = (data: any) => {
    console.log('📨 Nova mensagem via socket:', data);
    
    // Verificar se é deste contato
    if (data.client_id === contact._id || data.phone === contact.phone) {
      loadMessages();
    }
  };

  const handleSocketMessageRemoved = (data: any) => {
    console.log('🗑️ Mensagem removida via socket:', data);
    
    if (data.client_id === contact._id || data.phone === contact.phone) {
      loadMessages();
    }
  };

  // Escutar eventos
  socketService.on('api/chat created', handleSocketMessage);
  socketService.on('api/chat patched', handleSocketMessage);
  socketService.on('api/chat removed', handleSocketMessageRemoved);

  // Cleanup
  return () => {
    socketService.off('api/chat created', handleSocketMessage);
    socketService.off('api/chat patched', handleSocketMessage);
    socketService.off('api/chat removed', handleSocketMessageRemoved);
  };
}, [contact._id, contact.phone]);
```

---

## 🔄 Fluxo Completo:

### **Nova Mensagem:**
```
1. Cliente envia mensagem via WhatsApp
   ↓
2. Backend recebe e salva
   ↓
3. Backend emite evento: api/chat created
   ↓
4. Socket do app recebe evento
   ↓
5. ChatScreen recarrega lista de conversas
   ↓
6. ConversationScreen recarrega mensagens (se aberto)
   ↓
7. Usuário vê mensagem instantaneamente ⚡
```

### **Mensagem Atualizada:**
```
1. Mensagem é marcada como lida
   ↓
2. Backend emite: api/chat patched
   ↓
3. App atualiza status da mensagem
   ↓
4. UI reflete mudança ✅
```

### **Mensagem Removida:**
```
1. Mensagem é deletada
   ↓
2. Backend emite: api/chat removed
   ↓
3. App remove mensagem da lista
   ↓
4. UI atualizada 🗑️
```

---

## 📊 Logs:

### **Conexão:**
```
🔌 Conectando ao socket...
✅ Socket conectado: abc123xyz
🔌 Iniciando conexão socket para chat...
👂 Listener adicionado para evento: api/chat created
👂 Listener adicionado para evento: api/chat patched
👂 Listener adicionado para evento: api/chat removed
```

### **Nova Mensagem:**
```
📨 Mensagem socket recebida: { _id: '...', text: 'Olá!', ... }
📨 Nova mensagem via socket: { client_id: '...', ... }
Recarregando conversas...
Recarregando mensagens...
```

### **Reconexão:**
```
❌ Socket desconectado: transport close
🔄 Tentando reconectar socket... 1
🔄 Socket reconectado após 1 tentativas
```

---

## 🧪 Testar:

```bash
npx expo start --clear
```

**Verificar:**
1. ✅ Abrir app → Socket conecta
2. ✅ Enviar mensagem via web → Aparece no app
3. ✅ Enviar mensagem via app → Aparece na web
4. ✅ Marcar como lida → Atualiza em tempo real
5. ✅ Deletar mensagem → Remove em tempo real
6. ✅ Fechar app → Socket desconecta
7. ✅ Abrir app → Socket reconecta

---

## 🎯 Configuração:

### **URL do Socket:**
```typescript
const SOCKET_URL = 'https://api-now.sistemasnow.com.br';
```

### **Autenticação:**
```typescript
auth: {
  token: apiService.getAccessToken(),
}
```

### **Reconexão:**
```typescript
reconnection: true,
reconnectionDelay: 1000,
reconnectionDelayMax: 5000,
reconnectionAttempts: 5,
```

---

## 📝 Eventos do Backend:

| Evento | Quando | Ação |
|--------|--------|------|
| `api/chat created` | Nova mensagem | Recarregar conversas/mensagens |
| `api/chat patched` | Mensagem atualizada | Recarregar conversas/mensagens |
| `api/chat removed` | Mensagem deletada | Recarregar conversas/mensagens |

---

## 🚀 Próximos Passos:

### **Calendar (Eventos):**
- `api/events created`
- `api/events patched`
- `api/events removed`

### **Tasks (Tarefas):**
- `api/tasks created`
- `api/tasks patched`
- `api/tasks removed`

---

## ✅ Resultado:

- ✅ Socket.IO configurado
- ✅ Conexão automática
- ✅ Reconexão automática
- ✅ Chat em tempo real
- ✅ Lista de conversas atualiza
- ✅ Mensagens atualizam
- ✅ Igual à web

---

## 📄 Arquivos Criados:

✅ **`src/services/socket.ts`** - Serviço de socket  
✅ **ChatScreen** - Listeners adicionados  
✅ **ConversationScreen** - Listeners adicionados

---

**Chat em tempo real funcionando! 🔌⚡🎉**
