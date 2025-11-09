# 🔄 Mudança de /schedules para /tasks

## 📋 Mudanças Aplicadas

### 1. **API - getReminders()**
```typescript
// ❌ ANTES:
GET /schedules
  ?company_id=...
  &user_id=...
  &schedule_type=task_reminder
  &$populate=related_id

// ✅ AGORA:
GET /tasks
  ?company_id=...
  &$sort[_id]=-1
```

### 2. **Interface Reminder**
```typescript
// ❌ ANTES (schedules com populate):
interface Reminder {
  _id: string;
  scheduled_datetime: string;
  execution_status: string;
  delivery_methods: string[];
  related_id: {
    name: string;
    status: number;
  };
  metadata: { ... };
}

// ✅ AGORA (tasks direto):
interface Reminder {
  _id: string;
  name: string;              // ← Direto!
  date: number;              // ← 20251103
  hour?: string;
  minutes?: string;
  description?: string;
  preview?: string;
  status: number;            // ← Direto!
  company_id: string;
  createdAt: string;
}
```

---

## ⚠️ O Que Precisa Ser Corrigido no Código

Ainda há MUITAS referências antigas que precisam ser atualizadas:

### Substituições Necessárias:

| Antigo | Novo |
|--------|------|
| `reminder.related_id?.name` | `reminder.name` |
| `reminder.metadata?.title` | `reminder.name` |
| `reminder.related_id?.description` | `reminder.description \|\| reminder.preview` |
| `reminder.scheduled_datetime` | `parseTaskDate(reminder.date)` |
| `formatTime(reminder.scheduled_datetime)` | `formatTime(reminder)` |
| `reminder.execution_status === 'completed'` | `reminder.status === 1` |
| `reminder.delivery_methods` | ❌ Não existe mais |

---

## 📝 Arquivos Afetados

### ✅ Já Corrigidos:
- `src/services/api.ts` - getReminders() agora busca de `/tasks`
- Interface `Reminder` atualizada
- Funções `parseTaskDate()`, `formatDate()`, `formatTime()` ajustadas
- `groupRemindersByDate()` corrigida

### ⚠️ Ainda Precisam Correção:
- Linhas 322-424: Cards de lembretes (refs a `related_id`, `metadata`)
- Linhas 660-740: Modal de detalhes (refs a `related_id`, `scheduled_datetime`)
- Linhas 407-413: Edição (refs a `related_id`)

---

## 🛠️ Como Testar

1. **Ver se carrega:**
```bash
npm start
# Ir para página de Lembretes
# Deve carregar tasks de /tasks
```

2. **Verificar dados:**
- Título deve vir de `task.name`
- Data de `task.date` (20251103)
- Status de `task.status` (0 ou 1)

3. **Teste funcionalidades:**
- ✓ Marcar/desmarcar como concluído
- ✓ Ver detalhes
- ✓ Editar
- ✓ Deletar

---

## 🎯 Próximos Passos Recomendados

### Opção 1: Corrigir Manualmente
Substituir todas as 40+ referências a:
- `related_id` → campos diretos
- `metadata` → campos diretos  
- `scheduled_datetime` → `date` com parse
- `delivery_methods` → remover (não existe)

### Opção 2: Simplificar (Recomendado)
Como agora os dados vêm diretos de `/tasks`, o código fica MUITO mais simples:

```typescript
// ✅ SIMPLES:
<Text>{reminder.name}</Text>
<Text>{reminder.description || reminder.preview}</Text>
<Text>{formatDate(reminder.date)}</Text>
{reminder.hour && <Text>{reminder.hour}:{reminder.minutes}</Text>}
```

Sem precisar de:
- ❌ `reminder.related_id?.name || reminder.metadata?.title || ...`
- ❌ Populate
- ❌ Metadados complexos

---

## ✅ Benefícios da Mudança

1. **Mais Simples**: Dados diretos, sem populate
2. **Mais Rápido**: Uma chamada só
3. **Menos Complexo**: Sem `related_id` e `metadata`
4. **Ordem Correta**: `$sort[_id]=-1` (decrescente)

---

## 📊 Estrutura Final Esperada

```
GET /tasks?company_id=...&$sort[_id]=-1

Retorna:
[
  {
    "_id": "69081c6972c52ee48d0cf474",
    "name": "Ajustes Chat",           ← TÍTULO
    "date": 20251103,                 ← DATA
    "hour": "14",
    "minutes": "30",
    "description": "Descrição...",
    "preview": "Preview...",
    "status": 0,                      ← STATUS (0=pendente, 1=concluído)
    "company_id": "...",
    "createdAt": "2025-11-03T03:07:21.617Z"
  }
]
```

---

**Código precisa ser simplificado para remover todas as referências a `related_id` e `metadata`!**
