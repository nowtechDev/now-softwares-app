# ✅ Correção - Populate de Categoria e Tags

## 🐛 Problema Identificado:

A rota `/contacts-ordered` não suporta `$populate` do Feathers, então categoria e tags não estavam sendo carregadas.

---

## 🔧 Solução Aplicada:

Mudamos para usar a rota `/clients` com `$populate` para carregar categoria e tags.

### **Antes:**
```typescript
// ❌ Rota /contacts-ordered não suporta $populate
const response = await this.axiosInstance.get('/contacts-ordered', { params });
```

### **Depois:**
```typescript
// ✅ Rota /clients com $populate
const response = await this.axiosInstance.get('/clients', { 
  params: {
    ...params,
    '$populate': 'category_id,tags',  // Populate categoria e tags
    '$sort[lastMessageId]': -1,       // Ordenar por última mensagem
    '$sort[name]': 1,                 // Depois por nome
  }
});
```

---

## 📊 Models no Banco:

### **Client Model:**
```javascript
{
  _id: ObjectId,
  name: String,
  phone: String,
  company_id: ObjectId,
  category_id: ObjectId,  // ← Referência para Category
  tags: [ObjectId],       // ← Array de referências para Tag
  lastMessageId: ObjectId,
  // ... outros campos
}
```

### **Category Model:**
```javascript
{
  _id: ObjectId,
  name: String,
  color: String,          // ← Hex color (#10b981)
  description: String,
  company_id: ObjectId,
}
```

### **Tag Model:**
```javascript
{
  _id: ObjectId,
  name: String,
  color: String,          // ← Hex color (#ef4444)
  company_id: ObjectId,
}
```

---

## 🔍 Como Funciona o Populate:

### **Sem Populate:**
```json
{
  "_id": "123",
  "name": "Michael",
  "category_id": "456",
  "tags": ["789", "abc"]
}
```

### **Com Populate:**
```json
{
  "_id": "123",
  "name": "Michael",
  "category_id": {
    "_id": "456",
    "name": "Cliente",
    "color": "#10b981"
  },
  "tags": [
    {
      "_id": "789",
      "name": "Urgente",
      "color": "#ef4444"
    },
    {
      "_id": "abc",
      "name": "VIP",
      "color": "#8b5cf6"
    }
  ]
}
```

---

## 📝 Chamada da API:

### **No ChatScreen:**
```typescript
const contacts = await apiService.getOmnichannelContacts({
  withMessages: true,
  populate: 'category_id,tags',  // ← Populate categoria e tags
});
```

### **No ApiService:**
```typescript
// Adicionar populate se fornecido
if (options?.populate) {
  params['$populate'] = options.populate;
}

// Usar rota /clients com populate
const response = await this.axiosInstance.get('/clients', { 
  params: {
    ...params,
    '$sort[lastMessageId]': -1,
    '$sort[name]': 1,
  }
});
```

---

## 🎯 Parâmetros da Rota /clients:

```
GET /clients?company_id=xxx&limit=1000&$populate=category_id,tags&$sort[lastMessageId]=-1&$sort[name]=1
```

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `company_id` | ObjectId | Filtrar por empresa |
| `limit` | 1000 | Limite de resultados |
| `$populate` | `category_id,tags` | Populate categoria e tags |
| `$sort[lastMessageId]` | -1 | Ordenar por última mensagem (desc) |
| `$sort[name]` | 1 | Depois por nome (asc) |

---

## 📊 Mapeamento no Interface:

### **Contact Interface:**
```typescript
interface Contact {
  _id: string;
  name?: string;
  phone?: string;
  // ...
  category?: {
    _id: string;
    name: string;
    color: string;
  };
  tags?: Array<{
    _id: string;
    name: string;
    color: string;
  }>;
}
```

---

## 🔄 Fluxo Completo:

```
1. ChatScreen chama:
   apiService.getOmnichannelContacts({ populate: 'category_id,tags' })
   
2. ApiService faz request:
   GET /clients?$populate=category_id,tags&...
   
3. Backend (Feathers) popula:
   - category_id → objeto Category completo
   - tags → array de objetos Tag completos
   
4. Frontend recebe:
   - contact.category_id = { _id, name, color }
   - contact.tags = [{ _id, name, color }, ...]
   
5. ChatScreen mapeia:
   - contact.category = contact.category_id
   - contact.tags = contact.tags
   
6. Renderiza:
   - Badge de categoria ao lado do nome
   - Badges de tags abaixo do preview
```

---

## 🧪 Testar:

```bash
npx expo start --clear
```

**Verificar:**
1. ✅ Categoria aparece ao lado do nome
2. ✅ Tags aparecem abaixo do preview
3. ✅ Cores corretas (categoria e tags)
4. ✅ Até 3 tags + badge +N

---

## 📝 Observações:

### **Campo category vs category_id:**

No banco, o campo é `category_id`, mas quando populado, o Feathers retorna o objeto completo no mesmo campo:

```javascript
// Antes do populate
category_id: "ObjectId(456)"

// Depois do populate
category_id: {
  _id: "456",
  name: "Cliente",
  color: "#10b981"
}
```

Por isso, no código web, eles usam `contact.category` que é mapeado de `contact.category_id` após o populate.

### **Múltiplos $sort:**

O Feathers permite múltiplos `$sort`, aplicados em ordem:

```javascript
{
  '$sort[lastMessageId]': -1,  // Primeiro por lastMessageId (desc)
  '$sort[name]': 1              // Depois por name (asc)
}
```

---

## ✅ Resultado:

Agora categoria e tags são carregadas corretamente usando `$populate` do Feathers na rota `/clients`.

---

**Populate funcionando! 🎉**
