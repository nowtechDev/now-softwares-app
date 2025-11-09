# ✅ Populate Manual de Categoria e Tags

## 🐛 Problema:

A rota `/clients` não existe (erro 404), então não podemos usar o `$populate` nativo do Feathers.

---

## 🔧 Solução:

Fazer populate manual: buscar contatos com `/contacts-ordered`, depois buscar categorias e tags separadamente e mapear.

---

## 📊 Fluxo:

```
1. Buscar contatos:
   GET /contacts-ordered?company_id=xxx&limit=1000
   
2. Extrair IDs de categorias:
   categoryIds = contacts.map(c => c.category_id).filter(id => id)
   
3. Buscar categorias:
   GET /categories?_id[$in]=[id1,id2,id3]&$limit=1000
   
4. Mapear categorias para contatos:
   contact.category = categories.find(cat => cat._id === contact.category_id)
   
5. Extrair IDs de tags:
   tagIds = contacts.flatMap(c => c.tags || []).filter(id => id)
   
6. Buscar tags:
   GET /tags?_id[$in]=[id1,id2,id3]&$limit=1000
   
7. Mapear tags para contatos:
   contact.tags = contact.tags.map(tagId => tags.find(tag => tag._id === tagId))
```

---

## 💻 Implementação:

### **1. Buscar Contatos:**
```typescript
const response = await this.axiosInstance.get('/contacts-ordered', { params });

let contacts = [];
if (response.data && typeof response.data === 'object' && 'data' in response.data) {
  contacts = Array.isArray(response.data.data) ? response.data.data : [];
} else {
  contacts = Array.isArray(response.data) ? response.data : [];
}
```

### **2. Populate Manual (se solicitado):**
```typescript
if (options?.populate && contacts.length > 0) {
  const populateFields = options.populate.split(',').map(f => f.trim());
  
  // Buscar categorias
  if (populateFields.includes('category_id') || populateFields.includes('category')) {
    const categoryIds = contacts
      .map((c: any) => c.category_id)
      .filter((id: any) => id && typeof id === 'string');
    
    if (categoryIds.length > 0) {
      const categoriesResponse = await this.axiosInstance.get('/categories', {
        params: {
          _id: { $in: categoryIds },
          $limit: 1000
        }
      });
      const categories = this.normalizeFeathersResponse(categoriesResponse.data);
      
      contacts = contacts.map((contact: any) => {
        if (contact.category_id) {
          const category = categories.find((cat: any) => cat._id === contact.category_id);
          if (category) {
            return { ...contact, category };
          }
        }
        return contact;
      });
    }
  }
  
  // Buscar tags
  if (populateFields.includes('tags')) {
    const allTagIds = contacts
      .flatMap((c: any) => c.tags || [])
      .filter((id: any) => id && typeof id === 'string');
    
    if (allTagIds.length > 0) {
      const tagsResponse = await this.axiosInstance.get('/tags', {
        params: {
          _id: { $in: allTagIds },
          $limit: 1000
        }
      });
      const tags = this.normalizeFeathersResponse(tagsResponse.data);
      
      contacts = contacts.map((contact: any) => {
        if (contact.tags && Array.isArray(contact.tags)) {
          const populatedTags = contact.tags
            .map((tagId: any) => tags.find((tag: any) => tag._id === tagId))
            .filter((tag: any) => tag !== undefined);
          
          if (populatedTags.length > 0) {
            return { ...contact, tags: populatedTags };
          }
        }
        return contact;
      });
    }
  }
}

return contacts;
```

---

## 📋 Exemplo de Uso:

### **No ChatScreen:**
```typescript
const contacts = await apiService.getOmnichannelContacts({
  withMessages: true,
  populate: 'category_id,tags',  // ← Solicitar populate
});
```

### **Resultado:**
```json
[
  {
    "_id": "123",
    "name": "Michael",
    "category_id": "456",
    "category": {
      "_id": "456",
      "name": "Cliente",
      "color": "#10b981"
    },
    "tags": [
      "789",
      "abc"
    ],
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
]
```

---

## 🔍 Queries Feitas:

### **1. Buscar Contatos:**
```
GET /contacts-ordered?company_id=xxx&limit=1000
```

### **2. Buscar Categorias:**
```
GET /categories?_id[$in][]=456&_id[$in][]=789&$limit=1000
```

### **3. Buscar Tags:**
```
GET /tags?_id[$in][]=abc&_id[$in][]=def&$limit=1000
```

---

## ⚡ Performance:

### **Otimizações:**
1. ✅ Buscar todas as categorias de uma vez (`$in`)
2. ✅ Buscar todas as tags de uma vez (`$in`)
3. ✅ Usar `$limit=1000` para evitar paginação
4. ✅ Filtrar IDs duplicados antes de buscar
5. ✅ Só buscar se tiver IDs

### **Número de Requests:**
- **Sem populate:** 1 request
- **Com categoria:** 2 requests
- **Com categoria + tags:** 3 requests

---

## 🧪 Testar:

```bash
npx expo start --clear
```

**Verificar:**
1. ✅ Contatos aparecem
2. ✅ Categoria aparece ao lado do nome
3. ✅ Tags aparecem abaixo do preview
4. ✅ Cores corretas

---

## 📊 Comparação:

### **Populate Nativo (Feathers):**
```
GET /clients?$populate=category_id,tags
↓
1 request, tudo populado
```

### **Populate Manual:**
```
GET /contacts-ordered
GET /categories?_id[$in]=[...]
GET /tags?_id[$in]=[...]
↓
3 requests, populado manualmente
```

---

## ✅ Vantagens:

1. ✅ Funciona com `/contacts-ordered` (que existe)
2. ✅ Não depende de `$populate` do Feathers
3. ✅ Controle total sobre o que buscar
4. ✅ Pode adicionar cache facilmente

---

## ⚠️ Desvantagens:

1. ⚠️ Mais requests (3 ao invés de 1)
2. ⚠️ Mais código para manter
3. ⚠️ Pode ser mais lento em redes lentas

---

## 🎯 Resultado:

Contatos agora vêm com categoria e tags populadas, mesmo sem suporte nativo de `$populate` na rota `/contacts-ordered`.

---

**Populate manual funcionando! 🎉**
