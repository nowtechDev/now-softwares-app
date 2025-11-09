# ✅ Correção - Links de Texto vs Documentos

## 🐛 Problema:

**Links de texto apareciam como documento** ❌

### **Exemplo:**
```json
{
  "type": "text",
  "link": null,
  "content": "https://api-identity.sistemasnow.com.br/api/webhook/asaas"
}
```

**Resultado Errado:**
```
┌─────────────────────────────┐
│ [📄] Documento              │
│      Toque para abrir       │
└─────────────────────────────┘
```

**Resultado Esperado:**
```
https://api-identity.sistemasnow.com.br/api/webhook/asaas
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
(azul + sublinhado + clicável)
```

---

## 🔧 Causa do Problema:

A função `processMediaUrl` estava tratando **qualquer URL** como mídia/documento:

```typescript
// ❌ ANTES: Qualquer URL era tratada como mídia
const urlMatch = content?.match(/(https?:\/\/[^\s]+)/);
if (urlMatch) {
  return { url: urlMatch[0], type: detectType(urlMatch[0]) };
}
// Resultado: Link de texto → "document" → Card de documento
```

---

## ✅ Solução Aplicada:

Agora diferencia **links de texto** de **arquivos anexados**:

```typescript
// ✅ DEPOIS: Só trata como mídia se tiver extensão de arquivo
const processMediaUrl = (content: string, linkField?: string) => {
  // Se tem linkField, é mídia anexada
  if (linkField) {
    return { url: linkField, type: detectType(linkField) };
  }
  
  // Se não tem linkField, verificar se é arquivo
  const urlMatch = content?.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch) {
    const url = urlMatch[0];
    
    // ✅ Só tratar como mídia se tiver extensão de arquivo
    const hasFileExtension = /\.(jpg|jpeg|png|gif|webp|bmp|mp4|avi|mov|webm|mkv|mp3|wav|ogg|aac|m4a|opus|pdf|doc|docx|xls|xlsx)$/i.test(url);
    
    if (hasFileExtension) {
      return { url, type: detectType(url) };
    }
  }
  
  // Se não tem extensão, não é mídia (é link de texto)
  return null;
};
```

---

## 📊 Lógica de Detecção:

### **1. Tem `linkField`?**
```
✅ SIM → É mídia anexada
❌ NÃO → Verificar content
```

### **2. Content tem URL?**
```
✅ SIM → Verificar extensão
❌ NÃO → Não é mídia
```

### **3. URL tem extensão de arquivo?**
```
✅ SIM → É mídia (imagem/vídeo/áudio/documento)
❌ NÃO → É link de texto
```

---

## 🎯 Exemplos:

### **Exemplo 1: Link de Texto**
```json
{
  "type": "text",
  "link": null,
  "content": "https://google.com"
}
```
**Resultado:** Link clicável (azul + sublinhado)

---

### **Exemplo 2: Link de API**
```json
{
  "type": "text",
  "link": null,
  "content": "https://api-identity.sistemasnow.com.br/api/webhook/asaas"
}
```
**Resultado:** Link clicável (azul + sublinhado)

---

### **Exemplo 3: Imagem Anexada**
```json
{
  "type": "image",
  "link": "/uploads/image.jpg",
  "content": "[Imagem]"
}
```
**Resultado:** Preview da imagem

---

### **Exemplo 4: URL de Imagem no Texto**
```json
{
  "type": "text",
  "link": null,
  "content": "https://storage.googleapis.com/file.jpg"
}
```
**Resultado:** Preview da imagem (tem extensão .jpg)

---

### **Exemplo 5: Documento Anexado**
```json
{
  "type": "document",
  "link": "/uploads/file.pdf",
  "content": "[Documento]"
}
```
**Resultado:** Card de documento

---

### **Exemplo 6: URL de PDF no Texto**
```json
{
  "type": "text",
  "link": null,
  "content": "https://example.com/file.pdf"
}
```
**Resultado:** Card de documento (tem extensão .pdf)

---

## 📋 Extensões Reconhecidas:

### **Imagens:**
- jpg, jpeg, png, gif, webp, bmp

### **Vídeos:**
- mp4, avi, mov, webm, mkv

### **Áudios:**
- mp3, wav, ogg, aac, m4a, opus

### **Documentos:**
- pdf, doc, docx, xls, xlsx

---

## 🔍 Regex de Detecção:

```typescript
const hasFileExtension = /\.(jpg|jpeg|png|gif|webp|bmp|mp4|avi|mov|webm|mkv|mp3|wav|ogg|aac|m4a|opus|pdf|doc|docx|xls|xlsx)$/i.test(url);
```

**Explicação:**
- `\.` - Ponto literal
- `(jpg|jpeg|...)` - Uma das extensões
- `$` - Final da string
- `i` - Case insensitive

---

## 🧪 Testar:

```bash
npx expo start --clear
```

**Verificar:**

### **Links de Texto:**
1. ✅ `https://google.com` → Link clicável
2. ✅ `https://api.example.com/webhook` → Link clicável
3. ✅ URLs sem extensão → Link clicável

### **URLs de Arquivo:**
1. ✅ `https://example.com/image.jpg` → Preview de imagem
2. ✅ `https://example.com/video.mp4` → Thumbnail de vídeo
3. ✅ `https://example.com/file.pdf` → Card de documento

### **Mídias Anexadas:**
1. ✅ `type: "image"` + `link` → Preview de imagem
2. ✅ `type: "video"` + `link` → Thumbnail de vídeo
3. ✅ `type: "document"` + `link` → Card de documento

---

## 📊 Fluxograma:

```
Mensagem recebida
      ↓
Tem linkField?
  ├─ SIM → É mídia anexada → Renderizar mídia
  └─ NÃO → Verificar content
              ↓
        Content tem URL?
          ├─ NÃO → Renderizar texto normal
          └─ SIM → Verificar extensão
                      ↓
                URL tem extensão de arquivo?
                  ├─ SIM → É mídia → Renderizar mídia
                  └─ NÃO → É link → Renderizar link clicável
```

---

## ✅ Resultado:

### **Links de Texto:**
```
Acesse https://google.com para mais informações
       ^^^^^^^^^^^^^^^^^^
       (azul + sublinhado + clicável)
```

### **URLs de Arquivo:**
```
┌─────────────────────────────┐
│  [Preview da imagem.jpg]    │
└─────────────────────────────┘
```

### **Mídias Anexadas:**
```
┌─────────────────────────────┐
│ [📄] Documento              │
│      Toque para abrir       │
└─────────────────────────────┘
```

---

**Links de texto agora aparecem corretamente! 🎉**
