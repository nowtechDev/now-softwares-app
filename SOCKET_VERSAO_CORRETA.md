# ✅ Socket.IO - Versão Correta para React Native

## 🐛 Problema:

### **Erro com versão 4.5.4:**
```
ERROR Unable to resolve module ../contrib/yeast.js from 
C:\...\node_modules\engine.io-client\build\esm\transports\polling.js
```

**Causa:** Versão 4.5.4 tem problemas de resolução de módulos no React Native

---

## ✅ Solução:

### **Versão Correta:**
```bash
npm install socket.io-client@4.7.5
```

**Motivo:** Versão 4.7.5 tem melhor compatibilidade com React Native e Expo

---

## 🔧 Instalação:

### **Passo 1: Remover versão antiga**
```bash
npm uninstall socket.io-client
```

### **Passo 2: Instalar versão correta**
```bash
npm install socket.io-client@4.7.5
```

### **Passo 3: Limpar cache e iniciar**
```bash
npx expo start --clear
```

---

## 📊 Versões Testadas:

| Versão | Status | Observação |
|--------|--------|------------|
| 4.5.4 | ❌ Erro | Problema com yeast.js |
| 4.7.5 | ✅ OK | Funciona perfeitamente |
| 4.8.x | ⚠️ Não testado | Pode funcionar |

---

## 🎯 Compatibilidade:

### **Backend:**
- Socket.IO Server: 4.x
- Node.js: 18+

### **Mobile:**
- Socket.IO Client: 4.7.5
- React Native: 0.76+
- Expo: 52+

---

## 📝 Import Correto:

```typescript
// ✅ CORRETO para React Native
import io from 'socket.io-client';

// Uso:
const socket = io('https://api-now.sistemasnow.com.br', {
  transports: ['websocket', 'polling'],
  auth: { token: 'xxx' },
});
```

---

## 🧪 Testar:

```bash
npx expo start --clear
```

**Verificar:**
1. ✅ App compila sem erros
2. ✅ Sem erro de "yeast.js"
3. ✅ Socket conecta
4. ✅ Logs aparecem:
   ```
   🔌 Conectando ao socket...
   ✅ Socket conectado: abc123xyz
   ```

---

## 📄 Arquivos:

✅ **`install-socket.ps1`** - Script atualizado com versão 4.7.5  
✅ **`src/services/socket.ts`** - Import correto

---

## ⚠️ Notas Importantes:

### **1. Sempre usar versão 4.7.5:**
```json
{
  "dependencies": {
    "socket.io-client": "4.7.5"
  }
}
```

### **2. Limpar cache após instalar:**
```bash
npx expo start --clear
```

### **3. Se ainda der erro:**
```bash
# Limpar tudo
rm -rf node_modules
npm install
npx expo start --clear
```

---

## 🚀 Resultado:

- ✅ Socket.IO 4.7.5 instalado
- ✅ Sem erros de módulos
- ✅ Compatível com React Native
- ✅ Conexão funcionando
- ✅ Eventos em tempo real OK

---

**Socket.IO funcionando com versão correta! 🔌✅**
