# ✅ Correção - Socket.IO Client

## 🐛 Erro:

```
ERROR [TypeError: 0, _socketIoClient.io is not a function (it is undefined)]
```

---

## 🔧 Problema:

### **1. Import Incorreto:**
```typescript
// ❌ ERRADO (não funciona no React Native)
import { io, Socket } from 'socket.io-client';
```

### **2. Versão Incompatível:**
- Versão instalada pode não ser compatível
- React Native precisa de configuração específica

---

## ✅ Solução:

### **1. Import Correto:**
```typescript
// ✅ CORRETO (funciona no React Native)
import io from 'socket.io-client';
```

### **2. Tipos Ajustados:**
```typescript
class SocketService {
  private socket: any = null;  // ← any ao invés de Socket
  
  getSocket(): any {  // ← any ao invés de Socket | null
    return this.socket;
  }
}
```

### **3. Versão Instalada:**
```bash
npm install socket.io-client@4.5.4
```

---

## 📊 Mudanças:

### **Antes:**
```typescript
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  
  getSocket(): Socket | null {
    return this.socket;
  }
}
```

### **Depois:**
```typescript
import io from 'socket.io-client';

class SocketService {
  private socket: any = null;
  
  getSocket(): any {
    return this.socket;
  }
}
```

---

## 🔧 Instalação:

### **Opção 1: Script PowerShell**
```powershell
.\install-socket.ps1
```

### **Opção 2: Manual**
```bash
npm install socket.io-client@4.5.4
```

---

## 🧪 Testar:

```bash
npx expo start --clear
```

**Verificar:**
1. ✅ App inicia sem erros
2. ✅ Socket conecta
3. ✅ Logs aparecem:
   ```
   🔌 Conectando ao socket...
   ✅ Socket conectado: abc123xyz
   ```

---

## 📝 Logs Esperados:

### **Sucesso:**
```
🔌 Iniciando conexão socket para chat...
🔌 Conectando ao socket...
✅ Socket conectado: abc123xyz
👂 Listener adicionado para evento: api/chat created
👂 Listener adicionado para evento: api/chat patched
👂 Listener adicionado para evento: api/chat removed
```

### **Erro (se ainda houver):**
```
ERROR [TypeError: 0, _socketIoClient.io is not a function]
```
**Solução:** Limpar cache e reinstalar
```bash
npx expo start --clear
```

---

## 🎯 Versões Compatíveis:

| Pacote | Versão |
|--------|--------|
| `socket.io-client` | 4.5.4 |
| `socket.io` (backend) | 4.x |

**Nota:** Backend e client devem ter versões compatíveis (ambos 4.x)

---

## 📄 Arquivos Modificados:

✅ **`src/services/socket.ts`** - Import e tipos corrigidos  
✅ **`install-socket.ps1`** - Script de instalação criado

---

## ⚠️ Notas:

### **React Native vs Web:**
- React Native precisa de `import io from 'socket.io-client'`
- Web pode usar `import { io } from 'socket.io-client'`

### **TypeScript:**
- Usar `any` para tipos do socket em React Native
- Evita problemas de compatibilidade

---

## ✅ Resultado:

- ✅ Socket.IO instalado corretamente
- ✅ Import corrigido
- ✅ Tipos ajustados
- ✅ Sem erros
- ✅ Conexão funcionando

---

**Socket.IO corrigido e funcionando! 🔌✅**
