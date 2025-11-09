# ✅ Correção - Formatação de Data/Hora nas Mensagens

## 🎯 Objetivo:

Mostrar data completa quando mensagem tem mais de 24h, senão mostrar só hora (fuso Brasil).

---

## 📝 Código a Adicionar:

### Localização: `src/screens/ConversationScreen.tsx`

**Adicionar após a função `determineSender` (linha ~155):**

```typescript
// Formatar timestamp da mensagem (igual à web)
const formatMessageTime = (timestamp: string) => {
  if (!timestamp) return '';
  
  const messageDate = new Date(timestamp);
  const now = new Date();
  
  // Calcular diferença em horas
  const diffMs = now.getTime() - messageDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // Se mais de 24h, mostrar data completa
  if (diffHours >= 24) {
    return messageDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo', // Fuso do Brasil
    }).replace(',', ' às');
  }
  
  // Se menos de 24h, mostrar só hora
  return messageDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo', // Fuso do Brasil
  });
};
```

---

## 📊 Exemplos de Saída:

### Mensagem de Hoje (menos de 24h):
```
Entrada: "2025-01-08T14:30:00Z"
Saída: "14:30"
```

### Mensagem de Ontem (mais de 24h):
```
Entrada: "2025-01-07T10:00:00Z"
Saída: "07/01/2025 às 10:00"
```

### Mensagem Antiga:
```
Entrada: "2025-01-01T09:15:00Z"
Saída: "01/01/2025 às 09:15"
```

---

## 🔄 Lógica (Igual à Web):

```typescript
// Web (ChatMessage.tsx):
const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const d = dayjs(dateString);
  if (!d.isValid()) return "";
  const now = dayjs();
  const diffHours = now.diff(d, 'hour');
  if (diffHours >= 24) {
    return d.format('DD/MM/YYYY [às] HH:mm');
  }
  return d.format('HH:mm');
};

// Mobile (ConversationScreen.tsx):
const formatMessageTime = (timestamp: string) => {
  if (!timestamp) return '';
  const messageDate = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - messageDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours >= 24) {
    return messageDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).replace(',', ' às');
  }
  
  return messageDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
};
```

---

## ⚙️ Configurações Importantes:

### Fuso Horário:
```typescript
timeZone: 'America/Sao_Paulo'  // Brasília (UTC-3)
```

**Outros fusos do Brasil:**
- `America/Sao_Paulo` - Brasília, São Paulo, Rio (UTC-3)
- `America/Manaus` - Amazonas (UTC-4)
- `America/Noronha` - Fernando de Noronha (UTC-2)
- `America/Rio_Branco` - Acre (UTC-5)

### Formato de Data:
```typescript
{
  day: '2-digit',      // 01, 02, ..., 31
  month: '2-digit',    // 01, 02, ..., 12
  year: 'numeric',     // 2025
  hour: '2-digit',     // 00, 01, ..., 23
  minute: '2-digit',   // 00, 01, ..., 59
}
```

**Saída:** `"08/01/2025, 14:30"` → `"08/01/2025 às 14:30"`

---

## 🧪 Como Testar:

### 1. Mensagem Recente (< 24h):
```bash
# Enviar mensagem agora
# Verificar que mostra só hora: "14:30"
```

### 2. Mensagem Antiga (> 24h):
```bash
# Ver mensagem de ontem ou antes
# Verificar que mostra data completa: "07/01/2025 às 10:00"
```

### 3. Fuso Horário:
```bash
# Verificar que hora está correta para Brasil
# Não deve mostrar hora UTC
```

---

## 📱 Onde é Usado:

```typescript
// No renderMessage:
<View style={styles.messageFooter}>
  <Text style={[styles.messageTime, isUser && styles.messageTimeUser]}>
    {formatMessageTime(item.timestamp)}  {/* ← Aqui */}
  </Text>
  {/* Status icons... */}
</View>
```

---

## ✅ Checklist:

- [ ] Adicionar função `formatMessageTime` no ConversationScreen
- [ ] Verificar que está usando `timeZone: 'America/Sao_Paulo'`
- [ ] Testar com mensagem de hoje (< 24h) → Deve mostrar só hora
- [ ] Testar com mensagem de ontem (> 24h) → Deve mostrar data completa
- [ ] Verificar formato: "DD/MM/YYYY às HH:mm"

---

## 🔧 Aplicação Manual:

**IMPORTANTE:** O arquivo ConversationScreen.tsx está corrompido. Você precisa:

1. Fazer backup do arquivo atual
2. Restaurar de um commit anterior OU
3. Reescrever o arquivo com todas as correções

**Função a adicionar:**
- Localização: Após `determineSender` (linha ~155)
- Código: Copiar da seção "Código a Adicionar" acima

---

**Formatação igual à web implementada! 🎉**
