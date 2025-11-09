# 🔔 Lógica de Push Notifications - Lembretes

## 📋 Comportamento Implementado

### 1. **Criar NOVO Lembrete** ✨
```
Quando usuário clica no botão "+" (FAB):

┌─────────────────────────────┐
│  Criar Lembrete        [X]  │
├─────────────────────────────┤
│  Métodos de Entrega         │
│  🔔 Push         [✓]        │  ← MARCADO por padrão
│  📧 Email        [ ]        │  ← DESMARCADO
│  📱 WhatsApp     [ ]        │  ← DESMARCADO
└─────────────────────────────┘

Comportamento:
✅ Push SEMPRE marcado por padrão para novos
✅ Email desmarcado
✅ WhatsApp desmarcado
```

### 2. **Editar Lembrete EXISTENTE** ✏️
```
Quando usuário clica em editar:

1. Busca schedules da API:
   GET /schedules?related_id={taskId}&related_model=tasks

2. Se ENCONTROU schedules:
   - Verifica delivery_methods
   - Marca os switches conforme API
   
   Exemplo 1 - Com push e email:
   🔔 Push      [✓]   ← Tem na API
   📧 Email     [✓]   ← Tem na API
   📱 WhatsApp  [ ]   ← Não tem na API

   Exemplo 2 - Só email:
   🔔 Push      [ ]   ← NÃO tem na API
   📧 Email     [✓]   ← Tem na API
   📱 WhatsApp  [ ]   ← Não tem na API

3. Se NÃO ENCONTROU schedules:
   - Task SEM notificações agendadas
   🔔 Push      [ ]   ← TUDO desmarcado
   📧 Email     [ ]
   📱 WhatsApp  [ ]
```

---

## 🔄 Fluxo Completo

### Arquitetura Tasks + Schedules:

```
┌─────────────────────────────────────────────────┐
│ /tasks                                          │
│ ├─ Task 1: "Ligar para cliente"                │
│ │  └─ status: 0 (pendente)                     │
│ │  └─ date: 20251108                           │
│ └─ Task 2: "Enviar proposta"                   │
│    └─ status: 1 (concluído)                    │
└─────────────────────────────────────────────────┘
              ↕ relacionamento
┌─────────────────────────────────────────────────┐
│ /schedules                                      │
│ ├─ Schedule 1:                                  │
│ │  ├─ related_id: Task 1 ID                    │
│ │  ├─ related_model: "tasks"                   │
│ │  ├─ delivery_methods: ["push", "email"]      │
│ │  └─ scheduled_datetime: "2025-11-08T14:30"   │
│ └─ (Task 2 não tem schedules)                  │
└─────────────────────────────────────────────────┘
```

---

## 💻 Código Implementado

### 1. Default para NOVOS (resetForm):
```typescript
const resetForm = () => {
  // ... outros campos ...
  
  // Push marcado APENAS para NOVOS lembretes
  setSendPush(true);   // ✅ Default
  setSendEmail(false);
  setSendWhatsApp(false);
};
```

### 2. Carregar Schedules ao EDITAR:
```typescript
// Botão de editar
onPress={async () => {
  // ... preencher título, descrição, data ...
  
  // Verificar se tem schedules agendados
  try {
    const schedules = await apiService.getSchedulesForTask(reminder._id);
    
    if (schedules && schedules.length > 0) {
      // TEM schedules - marcar conforme API
      const schedule = schedules[0];
      const deliveryMethods = schedule.delivery_methods || [];
      setSendPush(deliveryMethods.includes('push'));
      setSendEmail(deliveryMethods.includes('email'));
      setSendWhatsApp(deliveryMethods.includes('whatsapp'));
    } else {
      // NÃO tem schedules - desmarcar tudo
      setSendPush(false);
      setSendEmail(false);
      setSendWhatsApp(false);
    }
  } catch (error) {
    // Erro ao buscar - desmarcar tudo
    setSendPush(false);
    setSendEmail(false);
    setSendWhatsApp(false);
  }
  
  setModalVisible(true);
}}
```

### 3. API - getSchedulesForTask:
```typescript
async getSchedulesForTask(taskId: string) {
  const user = await this.getCurrentUser();
  
  const response = await this.axiosInstance.get('/schedules', {
    params: {
      company_id: user.company_id,
      related_id: taskId,
      related_model: 'tasks',
      $limit: 10,
    },
  });
  
  return this.normalizeFeathersResponse(response.data);
}
```

---

## ✅ Comportamentos Corretos

| Ação | Push Switch |
|------|-------------|
| **Criar Novo** | ✅ Marcado (padrão) |
| **Editar com push agendado** | ✅ Marcado (vem da API) |
| **Editar sem push agendado** | ❌ Desmarcado (vem da API) |
| **Editar sem schedules** | ❌ Desmarcado (sem notificações) |

---

## 📱 UX Final

### Criar Novo:
```
1. Usuário clica em "+"
2. Modal abre com Push JÁ MARCADO ✓
3. Usuário só preenche título e salva
4. Push notification é agendada automaticamente
```

### Editar Existente:
```
1. Usuário clica em editar
2. Busca schedules da API...
3. Modal abre com switches refletindo a API
4. Usuário vê EXATAMENTE o que está agendado
5. Pode marcar/desmarcar e salvar
```

**UX honesta e transparente! 🎉**

---

**Desenvolvido por Now Softwares © 2024**
