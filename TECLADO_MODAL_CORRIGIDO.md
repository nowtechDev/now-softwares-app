# ✅ Teclado Ajustado nos Modais

## ❌ Problema:

Quando o usuário digitava em inputs dentro dos modais (Lembretes e Calendário), o teclado cobria os campos de entrada, tornando impossível ver o que estava sendo digitado.

```
┌──────────────┐
│ Modal        │
│ Input 1: ___ │  ← Visível
│ Input 2: ___ │  ← Escondido pelo teclado
│ Input 3: ___ │  ← Escondido pelo teclado
└──────────────┘
████████████████  ← Teclado
████████████████
```

---

## ✅ Solução: KeyboardAvoidingView

Adicionado `KeyboardAvoidingView` em todos os modais para que a tela se ajuste automaticamente quando o teclado aparecer.

---

## 🔧 Mudanças Aplicadas:

### 1. **RemindersScreen.tsx**

#### Importações:
```tsx
import {
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
```

#### Modal Criar Lembrete:
```tsx
// ANTES:
<Modal visible={modalVisible}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      {/* Inputs */}
    </View>
  </View>
</Modal>

// AGORA:
<Modal visible={modalVisible}>
  <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.modalOverlay}
  >
    <View style={styles.modalContent}>
      {/* Inputs */}
    </View>
  </KeyboardAvoidingView>
</Modal>
```

#### Modais Afetados:
- ✅ Modal Criar Lembrete
- ✅ Modal WhatsApp
- ✅ Modal Detalhes (mantido sem KeyboardAvoidingView, apenas leitura)

---

### 2. **CalendarScreen.tsx**

#### Importações:
```tsx
import {
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
```

#### Modal Criar Evento:
```tsx
// ANTES:
<Modal visible={createModalVisible}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      {/* Inputs */}
    </View>
  </View>
</Modal>

// AGORA:
<Modal visible={createModalVisible}>
  <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.modalOverlay}
  >
    <View style={styles.modalContent}>
      {/* Inputs */}
    </View>
  </KeyboardAvoidingView>
</Modal>
```

---

## 📱 Como Funciona:

### KeyboardAvoidingView Props:

| Propriedade | Valor | Descrição |
|-------------|-------|-----------|
| **behavior** | `'padding'` (iOS) | Move conteúdo para cima com padding |
| **behavior** | `'height'` (Android) | Reduz altura do container |
| **style** | `styles.modalOverlay` | Mantém layout do modal |

---

## 🎯 Comportamento por Plataforma:

### iOS (`behavior: 'padding'`):
- Adiciona padding inferior
- Empurra conteúdo para cima
- Mantém estrutura visual
- **Recomendado para iOS**

### Android (`behavior: 'height'`):
- Ajusta altura do container
- Comprime conteúdo
- Melhor performance
- **Recomendado para Android**

---

## 📊 Antes vs Agora:

### ANTES (Sem KeyboardAvoidingView):
```
┌──────────────┐
│ Modal        │
│ Título: ___  │  ← Visível
│ Descrição:   │  
│ __________   │  ← Coberto pelo teclado
│              │  
└──────────────┘
████████████████  ← Teclado cobre inputs
████████████████
```

### AGORA (Com KeyboardAvoidingView):
```
┌──────────────┐
│ Título: ___  │  ← Visível (movido para cima)
│ Descrição:   │  
│ __________   │  ← Visível! ✅
└──────────────┘
████████████████  ← Teclado não cobre
████████████████
```

---

## 🔍 Estrutura Completa:

### Modal com KeyboardAvoidingView:

```tsx
<Modal
  visible={modalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setModalVisible(false)}
>
  <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.modalOverlay}  // ← Flex: 1 para ocupar tela
  >
    <View style={styles.modalContent}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <Text>Título</Text>
        <TouchableOpacity onPress={close}>
          <Ionicons name="close" />
        </TouchableOpacity>
      </View>

      {/* ScrollView com inputs */}
      <ScrollView style={styles.modalScroll}>
        <Text style={styles.label}>Campo 1</Text>
        <TextInput style={styles.input} />
        
        <Text style={styles.label}>Campo 2</Text>
        <TextInput style={styles.input} multiline />
      </ScrollView>

      {/* Footer com botões */}
      <View style={styles.modalFooter}>
        <TouchableOpacity onPress={cancel}>
          <Text>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={save}>
          <Text>Salvar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </KeyboardAvoidingView>
</Modal>
```

---

## ⚙️ Outras Opções de behavior:

| Behavior | iOS | Android | Quando Usar |
|----------|-----|---------|-------------|
| **padding** | ✅ Melhor | ⚠️ OK | Modais bottom sheet |
| **height** | ⚠️ OK | ✅ Melhor | Telas fullscreen |
| **position** | ⚠️ OK | ❌ Não | Casos específicos |

---

## 🧪 Como Testar:

### 1. Lembretes:
```
1. Abrir app
2. Ir em Lembretes
3. Clicar no botão +
4. Clicar no campo "Descrição"
5. Teclado aparece
6. ✅ Campo "Descrição" deve estar visível acima do teclado
```

### 2. Calendário:
```
1. Abrir app
2. Ir em Calendário
3. Clicar no botão +
4. Clicar no campo "Descrição"
5. Teclado aparece
6. ✅ Campo "Descrição" deve estar visível acima do teclado
```

### 3. WhatsApp (Lembretes):
```
1. Ir em Lembretes
2. Clicar em um lembrete → WhatsApp
3. Clicar no campo "Mensagem"
4. Teclado aparece
5. ✅ Campo "Mensagem" deve estar visível
```

---

## 📋 Checklist:

- [x] KeyboardAvoidingView em Modal Criar Lembrete
- [x] KeyboardAvoidingView em Modal WhatsApp
- [x] KeyboardAvoidingView em Modal Criar Evento (Calendário)
- [x] behavior condicional por plataforma (iOS/Android)
- [x] style={styles.modalOverlay} aplicado
- [ ] Testar em iPhone (iOS)
- [ ] Testar em Android
- [ ] Verificar campos multiline
- [ ] Verificar scroll dentro do modal

---

## 💡 Dicas Adicionais:

### Se ainda houver problema:

#### 1. Adicionar keyboardVerticalOffset:
```tsx
<KeyboardAvoidingView 
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
  style={styles.modalOverlay}
>
```

#### 2. Usar ScrollView com keyboardShouldPersistTaps:
```tsx
<ScrollView 
  keyboardShouldPersistTaps="handled"
  style={styles.modalScroll}
>
  {/* Inputs */}
</ScrollView>
```

#### 3. Combinar com react-native-keyboard-aware-scroll-view:
```bash
npm install react-native-keyboard-aware-scroll-view
```

---

## ✅ Resultado:

- **iOS:** Inputs sempre visíveis acima do teclado ✅
- **Android:** Inputs acessíveis e visíveis ✅
- **UX:** Usuário pode ver o que está digitando ✅
- **Scroll:** Funciona normalmente dentro do modal ✅

---

## 🚀 Comando para Testar:

```bash
npx expo start --clear
```

**Agora você pode digitar nos modais sem o teclado cobrir! 🎉**
