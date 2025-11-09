# 📋 Análise Completa: Omnichannel Web → Mobile

## 🎯 Objetivo

Implementar tela de **Chat (Omnichannel)** no app React Native com **todas** as funcionalidades da versão web.

---

## 📂 Estrutura Web Analisada

### Arquivos Principais:
- **Communication.tsx**: Página principal do omnichannel
- **OmnichannelChatTabs.tsx**: Componente que gerencia tabs e contatos
- **ChatSidebar.tsx**: Lista de contatos/conversas
- **ChatArea.tsx**: Área de mensagens e input
- **ChatMessage.tsx**: Componente individual de mensagem
- **CustomerInfo.tsx**: Informações do cliente na lateral

---

## 📊 Modelo de Dados

### 1. **Contact (Cliente/Contato)**

```typescript
interface Contact {
  _id: string;
  name?: string;
  phone?: string;
  phone_origin?: string;  // Número de origem (WhatsApp)
  email?: string;
  instagram_id?: string;
  instagram_username?: string;
  instagram_fullname?: string;
  instagram_phone?: string;
  platform?: 'whatsapp' | 'instagram' | 'email';
  image?: string;
  ddd?: string;
  
  // ✅ Categoria e Tags
  category_id?: string;
  category?: {
    _id: string;
    name: string;
    color: string;
    description?: string;
  };
  tags?: string[]; // Array de IDs das tags
  
  // ✅ Última mensagem
  lastMessageId?: string; // ID da última mensagem
  lastMessage?: {
    content: string;
    isOpen: boolean;  // false = não lida
    date: string;
    phone_origin?: string;
  };
  
  // ✅ Contadores
  unreadCount?: number;  // Mensagens não lidas
  messageCount?: number; // Total de mensagens
}
```

### 2. **Message (Mensagem)**

```typescript
interface Message {
  _id: string;
  content: string;
  text?: string; // Transcrições de áudio
  time: string;  // HH:mm
  date: string;  // ISO string
  
  // ✅ Sender/Direction
  isClient: boolean; // true = recebida do cliente
  sender: 'user' | 'customer';
  event?: 'sent' | 'received' | 'sending';
  eventType?: 'sent' | 'received' | 'message_sent';
  
  // ✅ Canal/Plataforma
  channel: 'whatsapp' | 'instagram' | 'email';
  platform?: 'whatsapp' | 'instagram' | 'email';
  phone_origin?: string; // Número de origem
  from?: string;
  to?: string;
  
  // ✅ Tipo e Mídia
  type?: 'text' | 'audio' | 'image' | 'video' | 'pdf' | 'word' | 'excel' | 'ppt' | 'txt' | 'media';
  hasMedia?: boolean;
  mediaType?: string;
  link?: string; // URL do arquivo no servidor
  attachments?: Array<{
    filename: string;
    originalname?: string;
    mimetype?: string;
    size?: number;
    url: string;
  }>;
  
  // ✅ Status de Entrega
  status?: 'sending' | 'sent' | 'delivered' | 'undelivered' | 'failed';
  errorCode?: string;
  
  // ✅ Mensagem Template (WhatsApp)
  isTemplate?: boolean;
  hasButtons?: boolean;
  buttons?: Array<{
    type: 'url' | 'phone' | 'quick_reply';
    text: string;
    url?: string;
    phoneNumber?: string;
    payload?: string;
  }>;
  
  // ✅ Recursos Avançados
  isDeleted?: boolean;
  deletedMessageId?: string;
  isEdited?: boolean;
  editedAt?: string;
  reactions?: Array<{
    emoji: string;
    phone: string;
    pushName?: string;
    timestamp: number;
  }>;
  isReply?: boolean;
  quotedMessageId?: string;
  quotedText?: string;
  quotedMessageType?: string;
}
```

---

## 🔄 APIs e Endpoints

### 1. **Buscar Clientes (Paginado)**

```http
GET /clients
GET /clients?page=1&limit=50
```

**Resposta:**
```json
{
  "data": [
    {
      "_id": "...",
      "name": "Cliente",
      "phone": "+5551999...",
      "email": "...",
      "lastMessageId": "...",
      ...
    }
  ],
  "page": 1,
  "total": 150,
  "totalPages": 3
}
```

**Observação:** O modelo Client vem paginado: `res.data.data`

### 2. **Buscar Contatos do Omnichannel**

```http
GET /omnichannel/contacts
GET /omnichannel/contacts?platform=whatsapp
GET /omnichannel/contacts?phone_origin=+5551999...
GET /omnichannel/contacts?with_messages=true
GET /omnichannel/contacts?populate=category,tags
```

**Resposta:**
```json
{
  "data": [
    {
      "_id": "...",
      "name": "Cliente",
      "phone": "+5551999...",
      "phone_origin": "+5551995793844",
      "platform": "whatsapp",
      "lastMessage": {
        "content": "Olá!",
        "date": "2024-...",
        "isOpen": false
      },
      "unreadCount": 3,
      "category": {
        "_id": "...",
        "name": "VIP",
        "color": "#ff0000"
      },
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### 3. **Buscar Mensagens por Client ID**

```http
GET /client-messages/:company_id/:user_id?client_id=...&limit=100
GET /client-messages/:company_id/:user_id?client_id=...&phone_origin=...
```

**Fallback:**
```http
GET /omnichannel/messages/:contact_id
GET /omnichannel/messages/:contact_id?phone_number=...
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "client": { ... },
    "messages": [ ... ],
    "stats": {
      "total_messages": 150,
      "unread_messages": 3
    }
  }
}
```

### 4. **Buscar Mensagens por Contato (Fallback)**

```http
GET /chat?phone_origin=...&$sort[createdAt]=-1&$limit=500
GET /chat?from=...&$sort[createdAt]=-1&$limit=500
GET /chat?to=...&$sort[createdAt]=-1&$limit=500
```

### 5. **Enviar Mensagem**

#### WhatsApp:
```http
POST /whatsapp/send
```
```json
{
  "phone": "+5551999...",
  "message": "Olá!",
  "phone_origin": "+5551995793844",
  "user_id": "...",
  "company_id": "..."
}
```

#### WhatsApp com Áudio:
```http
POST /whatsapp/send-audio
```
```json
{
  "phone": "+5551999...",
  "audioBase64": "data:audio/ogg;base64,...",
  "phone_origin": "+5551995793844",
  "user_id": "...",
  "company_id": "..."
}
```

#### WhatsApp com Mídia:
```http
POST /whatsapp/send-media
```
```json
{
  "phone": "+5551999...",
  "caption": "Descrição",
  "mediaUrl": "https://...",
  "phone_origin": "+5551995793844",
  "user_id": "...",
  "company_id": "..."
}
```

#### Instagram:
```http
POST /instagram/send
```

#### Email:
```http
POST /email/send
```

### 6. **Agendar Mensagem**

```http
POST /schedules
```
```json
{
  "schedule_type": "message_reminder",
  "scheduled_datetime": "2024-...",
  "client_id": "...",
  "delivery_methods": ["whatsapp"],
  "metadata": {
    "message": "...",
    "phone": "...",
    "phone_origin": "..."
  }
}
```

---

## 🎨 UI/UX - ChatSidebar (Lista de Contatos)

### Layout:
```
┌─────────────────────────────────┐
│ 💬 Conversas          [👁️]      │  Header
├─────────────────────────────────┤
│ [💬] [ℹ️]                        │  Tabs: Conversas / Todos
├─────────────────────────────────┤
│ 🔍 Buscar contatos...           │  Search
├─────────────────────────────────┤
│                                 │
│ ┌────────────────────────────┐ │
│ │ 👤 João Silva        14:30 │ │  Contato
│ │ WA • Olá, tudo bem?     [3]│ │  - Badge plataforma
│ │ ✅ VIP                      │ │  - Categoria
│ │ +5551995793844              │ │  - Número origem
│ └────────────────────────────┘ │
│                                 │
│ ┌────────────────────────────┐ │
│ │ 👤 Maria Santos      12:15 │ │
│ │ IG • @maria_santos         │ │
│ └────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### Ordenação:
**Tab "Conversas":**
- ✅ Ordenado por `lastMessage.date` (decrescente)
- ✅ Somente contatos com mensagens

**Tab "Todos":**
- ✅ Ordenado alfabeticamente por `name`
- ✅ Todos os clientes do sistema

### Elementos Visuais:
- **Avatar:** Foto ou iniciais
- **Nome:** Nome do contato ou usuário
- **Badge Plataforma:** WA (verde), IG (roxo), Email (azul)
- **Última mensagem:** Preview truncado
- **Hora:** HH:mm da última mensagem
- **Badge Não Lidas:** Contador vermelho (ex: `3`)
- **Categoria:** Badge colorido (se tiver)
- **Número Origem:** Mostrado abaixo (WhatsApp)

---

## 💬 ChatArea (Área de Mensagens)

### Header:
```
┌─────────────────────────────────┐
│ [←] João Silva         WA  [⋮] │  Nome + Badge + Menu
│ +5551995793844                  │  Número origem
└─────────────────────────────────┘
```

### Lista de Mensagens:
```
┌─────────────────────────────────┐
│                                 │
│ ┌─────────────────┐             │  Mensagem do Cliente
│ │ Olá, tudo bem?  │  14:30      │  (Esquerda, cinza)
│ └─────────────────┘   ✓✓        │
│                                 │
│             ┌─────────────────┐ │  Mensagem Enviada
│        14:32 │ Tudo ótimo!    │ │  (Direita, azul)
│           ✓✓ └─────────────────┘ │
│                                 │
│ ┌─────────────────┐             │  Áudio
│ │ 🎤 0:15         │  14:35      │
│ └─────────────────┘             │
│                                 │
│ ┌─────────────────┐             │  Imagem
│ │ [🖼️ Imagem]    │  14:40      │
│ └─────────────────┘             │
│                                 │
└─────────────────────────────────┘
```

### Footer (Input):
```
┌─────────────────────────────────┐
│ [📎] [😀] Digite sua mensagem.. │
│ [🎤] [📅] [🔢]          [Enviar]│
└─────────────────────────────────┘
```

**Botões:**
- **📎**: Anexar arquivo (imagem, vídeo, documento)
- **😀**: Emoji picker
- **🎤**: Gravar áudio
- **📅**: Agendar mensagem
- **🔢**: Selecionar número WhatsApp de origem

---

## ⚙️ Funcionalidades Completas

### 1. **Lista de Contatos**
- [x] Buscar contatos do omnichannel
- [x] Paginação de clientes
- [x] Ordenação por última mensagem
- [x] Filtro por plataforma (WhatsApp, Instagram, Email)
- [x] Busca por nome/telefone/email
- [x] Badge de não lidas
- [x] Categoria e tags
- [x] Número de origem (WhatsApp)
- [x] Tab "Conversas" vs "Todos Clientes"

### 2. **Visualização de Mensagens**
- [x] Carregar mensagens por `client_id`
- [x] Scroll para última mensagem
- [x] Pull-to-refresh
- [x] Diferenciação enviadas/recebidas
- [x] Hora de envio
- [x] Status de entrega (✓, ✓✓, ⏳, ❌)
- [x] Suporte a mídia (imagem, vídeo, áudio, documento)
- [x] Preview de mídia
- [x] Download de arquivos
- [x] Mensagens com botões (templates)
- [x] Resposta citada (reply)
- [x] Reações com emoji
- [x] Mensagens editadas
- [x] Mensagens deletadas

### 3. **Envio de Mensagens**
- [x] Texto simples
- [x] Emoji picker
- [x] Gravar áudio
- [x] Anexar imagem
- [x] Anexar vídeo
- [x] Anexar documento
- [x] Múltiplos anexos
- [x] Preview antes de enviar
- [x] Selecionar número de origem (WhatsApp)
- [x] Atalhos de mensagem (shortcuts)

### 4. **Agendamento de Mensagens**
- [x] Abrir modal de agendamento
- [x] Selecionar data/hora
- [x] Selecionar plataforma
- [x] Pré-visualização
- [x] Confirmar agendamento
- [x] Ver agendamentos pendentes

### 5. **Número de Origem (WhatsApp)**
- [x] Detectar último número usado
- [x] Listar números disponíveis
- [x] Selecionar número manualmente
- [x] Padrão: número da última mensagem

### 6. **Janela 24h WhatsApp**
- [x] Detectar se passou 24h da última mensagem recebida
- [x] Bloquear input se expirado
- [x] Mostrar botão "Reiniciar Conversa" (template)
- [x] Enviar template aprovado

### 7. **Socket/Realtime**
- [x] Conectar ao socket
- [x] Receber novas mensagens
- [x] Atualizar lista de contatos
- [x] Notificação de mensagem nova
- [x] Atualizar status de entrega

### 8. **Extras**
- [x] Marcar como lida ao abrir
- [x] Vincular contato não linkado
- [x] Criar novo contato
- [x] Editar contato
- [x] Deletar conversa
- [x] Encaminhar mensagem
- [x] Copiar mensagem
- [x] Ver informações do cliente (sidebar)
- [x] Lembretes, propostas, projetos, etc.

---

## 🔍 Lógica de Ordenação

### Web (Communication.tsx):

```typescript
// Conversas (Tab "Conversas")
const conversations = contacts
  .filter(c => c.lastMessage) // Somente com mensagens
  .sort((a, b) => {
    const dateA = new Date(a.lastMessage?.date || 0);
    const dateB = new Date(b.lastMessage?.date || 0);
    return dateB.getTime() - dateA.getTime(); // Decrescente
  });

// Todos Clientes (Tab "Todos")
const allClients = clients.sort((a, b) => 
  a.name.localeCompare(b.name) // Alfabético
);
```

---

## 🎯 Estrutura de Telas no App

### Tela Principal: `ChatScreen.tsx`

```
ChatScreen
├─ Header (nome, busca, filtros)
├─ Tabs (Conversas / Todos Clientes)
├─ FlatList de Contatos
└─ FAB (Novo Chat)
```

### Tela de Conversa: `ConversationScreen.tsx`

```
ConversationScreen
├─ Header (nome, badge, menu)
├─ FlatList de Mensagens (inverted)
├─ Footer com Input
│  ├─ Botão Anexo
│  ├─ Emoji Picker
│  ├─ Input de Texto
│  ├─ Botão Áudio
│  ├─ Botão Agendar
│  ├─ Botão Número Origem
│  └─ Botão Enviar
└─ Modal de Seleção de Número
```

### Componentes:

1. **ContactListItem**: Item da lista de contatos
2. **MessageBubble**: Bolha de mensagem
3. **MediaMessage**: Mensagem com mídia
4. **AudioMessage**: Mensagem de áudio com player
5. **TemplateMessage**: Mensagem com botões
6. **ReplyMessage**: Mensagem de resposta citada
7. **EmojiPicker**: Seletor de emoji
8. **AudioRecorder**: Gravador de áudio
9. **AttachmentPicker**: Seletor de anexos
10. **ScheduleModal**: Modal de agendamento
11. **PhoneOriginPicker**: Seletor de número de origem

---

## 📦 Dependências Necessárias

```json
{
  "expo-image-picker": "~14.x",
  "expo-document-picker": "~11.x",
  "expo-av": "~13.x",
  "expo-file-system": "~16.x",
  "react-native-gifted-chat": "^2.x",
  "react-native-emoji-selector": "^0.2.x",
  "socket.io-client": "^4.x",
  "@react-native-community/datetimepicker": "^7.x"
}
```

---

## 🚀 Próximos Passos

1. ✅ Análise completa concluída
2. ⏳ Criar estrutura de pastas
3. ⏳ Implementar APIs no `api.ts`
4. ⏳ Criar tela `ChatScreen.tsx`
5. ⏳ Criar tela `ConversationScreen.tsx`
6. ⏳ Implementar componentes de mensagem
7. ⏳ Implementar envio de mensagens
8. ⏳ Implementar anexos e áudio
9. ⏳ Implementar agendamento
10. ⏳ Integrar socket
11. ⏳ Testar e ajustar

---

## 📝 Observações Importantes

### ⚠️ Janela 24h WhatsApp:
- Após 24h da última mensagem **recebida**, não pode enviar texto livre
- Deve usar **template aprovado** para reiniciar conversa
- Templates: `contentSid`, `contentInicialSid`, `contentRetomarSid`

### 📱 Números de Origem:
- Cada empresa pode ter múltiplos números WhatsApp
- Sempre usar o número da última mensagem como padrão
- Permitir trocar manualmente

### 🔄 Paginação:
- Cliente: `res.data.data` (paginado)
- Mensagens: Carregar últimas 100, depois load more

### 🎨 UI/UX:
- Seguir design do app (cores, fontes, espaçamentos)
- SafeAreaView em todas as telas
- KeyboardAvoidingView nos inputs
- Loading states
- Empty states
- Error handling

---

**Análise concluída! Pronto para implementar! 🚀**
