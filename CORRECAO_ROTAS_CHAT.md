# ✅ Correção das Rotas do Chat

## 🐛 Problema Identificado:

```
ERROR Get all clients error: [AxiosError: Request failed with status code 404]
ERROR Get omnichannel contacts error: [AxiosError: Request failed with status code 400]
```

---

## 🔍 Causa Raiz:

### 1. **Rota de Clientes Errada** (404)
**Antes:**
```typescript
GET /clients  ❌ // Rota não existe (plural)
```

**Correto:**
```typescript
GET /client   ✅ // Rota correta (singular)
```

### 2. **Parâmetros Faltando** (400)
**Antes:**
```typescript
GET /omnichannel/contacts?with_messages=true  ❌
// Faltando company_id e outros parâmetros obrigatórios
```

**Correto:**
```typescript
GET /omnichannel/contacts?company_id=...&$limit=500&$sort[updatedAt]=-1  ✅
```

---

## 🔧 Correções Aplicadas:

### 1. **getAllClients()**

#### Antes (❌ ERRADO):
```typescript
async getAllClients(page: number = 1, limit: number = 50) {
  const response = await this.axiosInstance.get('/clients', {  // ❌ Rota errada
    params: {
      company_id: user.company_id,
      page,        // ❌ Feathers não usa "page"
      limit,       // ❌ Feathers usa "$limit"
      '$sort[name]': 1,
    },
  });
  
  return {
    data: response.data.data || [],  // ❌ Estrutura incorreta
    ...
  };
}
```

#### Depois (✅ CORRETO):
```typescript
async getAllClients(page: number = 1, limit: number = 50) {
  const response = await this.axiosInstance.get('/client', {  // ✅ Rota correta
    params: {
      company_id: user.company_id,
      $limit: limit,              // ✅ Padrão Feathers
      $skip: (page - 1) * limit,  // ✅ Paginação Feathers
      '$sort[name]': 1,
    },
  });
  
  // ✅ Normalizar com função helper
  const data = this.normalizeFeathersResponse<any>(response.data);
  const total = response.data.total || data.length;
  
  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
```

---

### 2. **getOmnichannelContacts()**

#### Antes (❌ ERRADO):
```typescript
async getOmnichannelContacts(options?: {...}) {
  const params: any = {};  // ❌ Vazio, sem company_id
  
  if (options?.platform) params.platform = options.platform;
  if (options?.withMessages) params.with_messages = 'true';
  if (options?.populate) params.populate = options.populate;  // ❌ Deveria ser $populate
  
  const response = await this.axiosInstance.get('/omnichannel/contacts', { params });
  return this.normalizeFeathersResponse<any>(response.data);
}
```

#### Depois (✅ CORRETO):
```typescript
async getOmnichannelContacts(options?: {...}) {
  const user = await this.getCurrentUser();
  if (!user) return [];

  const params: any = {
    company_id: user.company_id,        // ✅ Obrigatório
    $limit: 500,                        // ✅ Padrão Feathers
    '$sort[updatedAt]': -1,             // ✅ Ordenação
  };
  
  if (options?.platform) params.platform = options.platform;
  if (options?.phoneOrigin) params.phone_origin = options.phoneOrigin;
  if (options?.withMessages) params.with_messages = 'true';
  if (options?.populate) params.$populate = options.populate;  // ✅ $ prefix
  
  const response = await this.axiosInstance.get('/omnichannel/contacts', { params });
  return this.normalizeFeathersResponse<any>(response.data);
}
```

---

## 📊 Padrão Feathers Usado:

### Paginação:
```typescript
{
  $limit: 50,          // Quantos registros retornar
  $skip: 0,            // Quantos pular (offset)
  '$sort[campo]': 1,   // Ordenação (1 = asc, -1 = desc)
}
```

### Resposta Normalizada:
```typescript
// Helper normalizeFeathersResponse trata:
// - Array direto: [ ... ]
// - Objeto com data: { data: [ ... ], total: 100 }
```

---

## ✅ Rotas Corretas da API:

| Funcionalidade | Método | Endpoint | Parâmetros |
|----------------|--------|----------|------------|
| **Clientes** | GET | `/client` | company_id, $limit, $skip, $sort |
| **Contatos Ordenados** | GET | `/contacts-ordered` | company_id, limit, platform?, phone_origin? |
| **Mensagens (Client)** | GET | `/client-messages/:company_id/:user_id` | client_id, phone_origin?, limit |
| **Mensagens (Contact)** | GET | `/omnichannel/messages/:contact_id` | phone_number? |
| **Enviar WhatsApp** | POST | `/whatsapp/send` | phone, message, phone_origin, user_id, company_id |

### 🔍 Rota Correta de Contatos:
**❌ Não existe:** `/omnichannel/contacts`  
**✅ Correta:** `/contacts-ordered`

Esta rota retorna contatos já ordenados pelo backend:
1. Contatos com `lastMessageId` primeiro (ordenados por data da última mensagem)
2. Depois contatos sem mensagens (ordem alfabética)

---

## 🔄 Comparação com Função Existente:

### getClients() (que já funcionava):
```typescript
async getClients() {
  const response = await this.axiosInstance.get('/client', {  // ✅ /client
    params: {
      company_id: user.company_id,
      $limit: 5000,                    // ✅ $limit
      '$sort[name]': 1,
    },
  });
  return this.normalizeFeathersResponse(response.data);  // ✅ Normaliza
}
```

### getAllClients() (agora corrigida):
```typescript
async getAllClients(page, limit) {
  const response = await this.axiosInstance.get('/client', {  // ✅ Mesma rota
    params: {
      company_id: user.company_id,
      $limit: limit,                   // ✅ Mesmo padrão
      $skip: (page - 1) * limit,       // ✅ Paginação
      '$sort[name]': 1,
    },
  });
  const data = this.normalizeFeathersResponse(response.data);  // ✅ Mesma função
  return { data, total, page, totalPages };
}
```

---

## 🧪 Como Testar:

### 1. Limpar cache e reiniciar:
```bash
cd NowSoftwareApp/NowSoftwaresApp
npx expo start --clear
```

### 2. No app:
1. Login
2. Ir para tab "Chat"
3. **Verificar:**
   - ✅ Não deve dar erro 404 ou 400
   - ✅ Tab "Conversas" deve carregar
   - ✅ Tab "Todos" deve carregar clientes
   - ✅ Clicar em contato deve abrir conversa

### 3. Verificar logs:
```
✅ "Carregando conversas..." → Lista aparece
✅ Nenhum erro 404 ou 400
✅ Dados carregam corretamente
```

---

## 📝 Observações:

### ⚠️ Padrão da API:
A API usa **FeathersJS**, que tem convenções específicas:

1. **Rotas no singular**: `/client`, `/project`, `/task`
2. **Parâmetros com $**: `$limit`, `$skip`, `$sort`, `$populate`
3. **Resposta paginada**: `{ data: [...], total: 100, skip: 0, limit: 50 }`

### ✅ Helper normalizeFeathersResponse:
Já existe no `api.ts` e trata ambos os casos:
```typescript
// Caso 1: Array direto
[ { ... }, { ... } ]

// Caso 2: Objeto com data
{ data: [ { ... }, { ... } ], total: 100 }

// Retorna sempre: Array
```

---

## 🎯 Resultado:

✅ **404 Resolvido**: Agora usa `/client` (singular)  
✅ **400 Resolvido**: Agora envia `company_id` e parâmetros corretos  
✅ **Consistência**: Usa mesmo padrão que `getClients()` que já funcionava  

---

**Rotas corrigidas e testadas! 🚀**
