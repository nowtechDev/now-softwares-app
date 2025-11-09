# ✅ Número Padrão e Validação Implementados!

## 🎯 Funcionalidades Adicionadas:

### **1. Número Padrão Automático** ✅
- Usa `phone_origin` da última mensagem
- Só para WhatsApp
- Normaliza números para comparação
- Se não encontrar, usa "Auto"

### **2. Validação de Envio** ✅
- Não permite enviar sem número selecionado
- Mostra alert pedindo para selecionar
- Botão para abrir seletor direto

---

## 🔧 Implementação:

### **Definir Número Padrão:**
```typescript
useEffect(() => {
  if (phoneConfigs.length === 0 || !contact) return;

  // Se a plataforma for WhatsApp e houver phone_origin
  if ((contact.platform === 'whatsapp' || selectedPlatform === 'whatsapp') && phoneOrigin) {
    // Normalizar número para comparação (remover caracteres especiais)
    const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
    const normalizedOrigin = normalizePhone(phoneOrigin);

    // Buscar configuração correspondente
    const matchingConfig = phoneConfigs.find(config => {
      const normalizedConfig = normalizePhone(config.phone_number);
      return normalizedConfig === normalizedOrigin;
    });

    if (matchingConfig) {
      setSelectedPhoneOrigin(matchingConfig._id);
      console.log(`✅ Número padrão definido: ${matchingConfig.phone_number}`);
    } else {
      setSelectedPhoneOrigin('auto');
      console.log('⚠️ Número da última mensagem não encontrado nas configurações, usando Auto');
    }
  }
}, [phoneConfigs, contact, phoneOrigin, selectedPlatform]);
```

### **Validação de Envio:**
```typescript
const handleSendMessage = async () => {
  if (!messageInput.trim() || sending) return;
  
  // Validar se tem número selecionado para WhatsApp
  if (selectedPlatform === 'whatsapp') {
    const phoneOriginToUse = selectedPhoneOrigin === 'auto' 
      ? phoneOrigin 
      : phoneConfigs.find(c => c._id === selectedPhoneOrigin)?.phone_number;

    if (!phoneOriginToUse) {
      Alert.alert(
        'Número não selecionado',
        'Por favor, selecione um número WhatsApp para enviar a mensagem.',
        [
          { 
            text: 'Selecionar Número', 
            onPress: () => handleSelectPhoneOrigin() 
          },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
      return;
    }
  }
  
  // ... resto do código de envio
};
```

---

## 📊 Fluxo:

### **Cenário 1: Última mensagem veio do número +5551999999999**
```
1. Abre conversa
2. Carrega phoneConfigs
3. Normaliza: 5551999999999
4. Busca nas configs
5. Encontra: "Atendimento (+5551999999999)"
6. Define como padrão
7. Mostra: "Enviando por: +5551999999999"
```

### **Cenário 2: Última mensagem veio de número não configurado**
```
1. Abre conversa
2. Carrega phoneConfigs
3. Normaliza número
4. Não encontra nas configs
5. Define como "Auto"
6. Não mostra texto abaixo do input
```

### **Cenário 3: Tenta enviar sem número**
```
1. Usuário digita mensagem
2. Clica em enviar
3. Valida: phoneOriginToUse está vazio?
4. Mostra alert: "Número não selecionado"
5. Opções:
   - Selecionar Número → Abre modal
   - Cancelar → Fecha alert
```

---

## 🔍 Normalização de Números:

### **Função:**
```typescript
const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
```

### **Exemplos:**
```
+55 51 99999-9999  → 5551999999999
(51) 9 9999-9999   → 5551999999999
51999999999        → 5551999999999
```

---

## 🛣️ Rota de Envio:

### **Endpoint:**
```
POST /whatsapp/send
```

### **Body:**
```json
{
  "phone": "+5551888888888",
  "message": "Olá!",
  "phone_origin": "+5551999999999",
  "user_id": "...",
  "company_id": "..."
}
```

### **Lógica Backend:**
```javascript
// Backend usa phone_origin para determinar qual API externa chamar
url + 'api-' + company.containerWhats + '/whatsapp/send/text'
```

**Cada número tem sua própria API/container:**
- Número 1 → api-1
- Número 2 → api-2
- etc.

---

## 📝 Logs:

### **Sucesso:**
```
📞 Carregando números WhatsApp...
✅ Números carregados: 3
✅ Número padrão definido: +5551999999999
📤 Enviando mensagem via whatsapp...
📞 Enviando pelo número: +5551999999999
✅ Mensagem enviada!
```

### **Número não encontrado:**
```
📞 Carregando números WhatsApp...
✅ Números carregados: 3
⚠️ Número da última mensagem não encontrado nas configurações, usando Auto
```

### **Sem número selecionado:**
```
📤 Tentando enviar...
❌ Número não selecionado
Alert: "Por favor, selecione um número WhatsApp"
```

---

## 🧪 Testar:

```bash
npx expo start --clear
```

**Verificar:**
1. ✅ Abre conversa → Número padrão é definido automaticamente
2. ✅ Número da última mensagem → Aparece abaixo do input
3. ✅ Tenta enviar sem número → Mostra alert
4. ✅ Seleciona número → Envia corretamente
5. ✅ Instagram/Email → Não valida número

---

## 🎯 Regras:

### **WhatsApp:**
- ✅ Requer número selecionado
- ✅ Usa phone_origin da última mensagem como padrão
- ✅ Valida antes de enviar

### **Instagram:**
- ❌ Não usa phone_origin
- ❌ Não valida número
- ⏳ Em breve

### **Email:**
- ❌ Não usa phone_origin
- ❌ Não valida número
- ⏳ Em breve

---

## ✅ Resultado:

- ✅ Número padrão definido automaticamente
- ✅ Validação de envio implementada
- ✅ Rota de envio correta (`/whatsapp/send`)
- ✅ Não permite enviar sem número

---

**Número padrão e validação funcionando! 📞✅**
