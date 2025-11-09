# 🔍 Logs Detalhados - Socket Debug

## 📊 Logs Adicionados:

### **ChatScreen (Lista de Conversas):**

#### **Inicialização:**
```
🔌 [ChatScreen] Iniciando conexão socket para chat...
📋 [ChatScreen] Tab ativa: conversations
👂 [ChatScreen] Adicionando listeners para eventos socket...
✅ [ChatScreen] Listeners adicionados com sucesso
```

#### **Recebendo Mensagem:**
```
📥 Evento recebido: api/chat created [{ ... }]  ← Do socketService
📨 [ChatScreen] Mensagem socket recebida: { ... }
📋 [ChatScreen] Tab atual: conversations
🔄 [ChatScreen] Atualizando lista de conversas...
📊 [ChatScreen] Total de conversas atuais: 5
🔍 [ChatScreen] Procurando contato - client_id: xxx, phone: xxx
📍 [ChatScreen] Índice encontrado: 2
✅ [ChatScreen] Contato encontrado - atualizando e movendo para o topo
🔝 [ChatScreen] Movendo contato para o topo
```

#### **Novo Contato:**
```
📍 [ChatScreen] Índice encontrado: -1
🆕 [ChatScreen] Novo contato - buscando dados completos...
```

#### **Mensagem Removida:**
```
🗑️ [ChatScreen] Mensagem removida: { ... }
🔄 [ChatScreen] Recarregando conversas após remoção...
```

---

### **ConversationScreen (Mensagens):**

#### **Inicialização:**
```
🔌 [ConversationScreen] Conectando socket para mensagens em tempo real...
👤 [ConversationScreen] Contato atual: 123abc João Silva
👂 [ConversationScreen] Adicionando listeners para eventos socket...
✅ [ConversationScreen] Listeners adicionados com sucesso
```

#### **Recebendo Mensagem:**
```
📥 Evento recebido: api/chat created [{ ... }]  ← Do socketService
📨 [ConversationScreen] Nova mensagem via socket: { ... }
🔍 [ConversationScreen] Verificando se é deste contato...
   - data.client_id: 123abc vs contact._id: 123abc
   - data.phone: 5511999999999 vs contact.phone: 5511999999999
✅ [ConversationScreen] Mensagem é deste contato - processando...
📊 [ConversationScreen] Total de mensagens atuais: 10
🔍 [ConversationScreen] Mensagem já existe? false
🆕 [ConversationScreen] Adicionando nova mensagem...
📝 [ConversationScreen] Nova mensagem criada: { ... }
📜 [ConversationScreen] Fazendo scroll para o final...
✅ [ConversationScreen] Mensagem adicionada com sucesso
```

#### **Mensagem de Outro Contato:**
```
📨 [ConversationScreen] Nova mensagem via socket: { ... }
🔍 [ConversationScreen] Verificando se é deste contato...
   - data.client_id: 456def vs contact._id: 123abc
   - data.phone: 5511888888888 vs contact.phone: 5511999999999
⏭️ [ConversationScreen] Mensagem de outro contato - ignorando
```

#### **Mensagem Atualizada:**
```
🔍 [ConversationScreen] Mensagem já existe? true
🔄 [ConversationScreen] Atualizando mensagem existente...
```

#### **Mensagem Removida:**
```
🗑️ [ConversationScreen] Mensagem removida via socket: { ... }
🗑️ [ConversationScreen] Removendo mensagem do estado...
✅ [ConversationScreen] Mensagem removida. Total restante: 9
```

---

### **SocketService:**

#### **Conexão:**
```
🔌 Conectando ao socket... https://api-now.sistemasnow.com.br
🔌 Socket criado, aguardando conexão...
✅ Socket conectado: abc123xyz
```

#### **Listeners:**
```
👂 Listener adicionado para evento: api/chat created
🔌 Socket conectado? true
```

#### **Eventos Recebidos:**
```
📥 Evento recebido: api/chat created [{ _id: '...', text: 'Olá!', ... }]
```

#### **Desconexão:**
```
❌ Socket desconectado: transport close
🔄 Tentando reconectar socket... 1
```

---

## 🧪 Como Usar os Logs:

### **1. Verificar Conexão:**
Procure por:
```
✅ Socket conectado: abc123xyz
```

### **2. Verificar Listeners:**
Procure por:
```
✅ [ChatScreen] Listeners adicionados com sucesso
✅ [ConversationScreen] Listeners adicionados com sucesso
```

### **3. Verificar Recebimento:**
Procure por:
```
📥 Evento recebido: api/chat created
```

### **4. Verificar Processamento:**
Procure por:
```
✅ [ChatScreen] Contato encontrado - atualizando
✅ [ConversationScreen] Mensagem adicionada com sucesso
```

---

## 🔍 Diagnóstico de Problemas:

### **Socket não conecta:**
```
❌ Erro de conexão socket: ...
```
**Solução:** Verificar URL e configurações

### **Eventos não chegam:**
```
🔌 Socket conectado? false
```
**Solução:** Socket não está conectado

### **Mensagens não aparecem:**
```
⏭️ [ConversationScreen] Mensagem de outro contato - ignorando
```
**Solução:** Verificar client_id e phone

### **Tab errada:**
```
⏭️ [ChatScreen] Ignorando - tab não é conversations
```
**Solução:** Mudar para tab "Conversas"

---

## 📊 Fluxo Completo Esperado:

### **Nova Mensagem:**
```
1. 📥 Evento recebido: api/chat created
2. 📨 [ChatScreen] Mensagem socket recebida
3. 🔄 [ChatScreen] Atualizando lista de conversas
4. 📊 [ChatScreen] Total de conversas atuais: 5
5. 🔍 [ChatScreen] Procurando contato
6. ✅ [ChatScreen] Contato encontrado
7. 🔝 [ChatScreen] Movendo contato para o topo
```

### **Na Conversa Aberta:**
```
1. 📥 Evento recebido: api/chat created
2. 📨 [ConversationScreen] Nova mensagem via socket
3. 🔍 [ConversationScreen] Verificando se é deste contato
4. ✅ [ConversationScreen] Mensagem é deste contato
5. 🆕 [ConversationScreen] Adicionando nova mensagem
6. 📜 [ConversationScreen] Fazendo scroll
7. ✅ [ConversationScreen] Mensagem adicionada com sucesso
```

---

## 🎯 Logs Importantes:

| Log | Significado |
|-----|-------------|
| `✅ Socket conectado` | Socket OK |
| `📥 Evento recebido` | Evento chegou do backend |
| `✅ Contato encontrado` | Mensagem processada na lista |
| `✅ Mensagem adicionada` | Mensagem apareceu na conversa |
| `⏭️ Ignorando` | Mensagem filtrada (normal) |
| `❌ Erro` | Problema detectado |

---

**Logs detalhados adicionados! 🔍📊**
