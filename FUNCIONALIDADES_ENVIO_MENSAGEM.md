# 📱 Funcionalidades de Envio de Mensagem - App Mobile

## 🎯 Funcionalidades da Web para Implementar:

### 1. **Seletor de Plataforma** 📡
- WhatsApp
- Instagram
- Email
- Auto (detecta automaticamente)

### 2. **Seletor de Número de Origem (WhatsApp)** 📞
- Lista de números configurados
- Twilio ou ApiZap
- Auto (usa padrão)

### 3. **Picker de Emojis** 😊
- Biblioteca de emojis
- Busca de emojis
- Categorias

### 4. **Anexos de Arquivos** 📎
- Imagens
- Vídeos
- Documentos
- Áudios

### 5. **Gravação de Áudio** 🎤
- Gravar áudio
- Transcrição automática com IA
- Endpoint: `/api/agents/audio-transcription`

### 6. **Agendamento de Mensagens** ⏰
- Agendar data e hora
- Listar agendamentos
- Cancelar agendamentos
- Endpoint: `/schedules`

### 7. **Atalhos de Mensagem** ⚡
- Mensagens pré-definidas
- Inserir rapidamente

---

## 📊 Estrutura de Implementação:

### **ConversationScreen.tsx:**

```
┌─────────────────────────────────────────┐
│ [←] Nome do Contato            [ℹ️]    │ ← Header
├─────────────────────────────────────────┤
│                                         │
│  Mensagens...                           │
│                                         │
├─────────────────────────────────────────┤
│ [📎] [😊] [🎤] [⏰]                     │ ← Botões ação
├─────────────────────────────────────────┤
│ Plataforma: [WhatsApp ▼]                │ ← Seletor plataforma
│ Número: [+5551999... ▼]                 │ ← Seletor número
├─────────────────────────────────────────┤
│ [Digite sua mensagem...]         [📤]  │ ← Input + Enviar
└─────────────────────────────────────────┘
                                          ↑
                                    Padding 20px
```

---

## 🔧 Implementação Detalhada:

### **1. Seletor de Plataforma:**

```typescript
const [selectedPlatform, setSelectedPlatform] = useState<'auto' | 'whatsapp' | 'instagram' | 'email'>('auto');

<View style={styles.platformSelector}>
  <Text style={styles.label}>Plataforma:</Text>
  <Picker
    selectedValue={selectedPlatform}
    onValueChange={setSelectedPlatform}
  >
    <Picker.Item label="Auto" value="auto" />
    <Picker.Item label="WhatsApp" value="whatsapp" />
    <Picker.Item label="Instagram" value="instagram" />
    <Picker.Item label="Email" value="email" />
  </Picker>
</View>
```

---

### **2. Seletor de Número (WhatsApp):**

```typescript
const [phoneConfigs, setPhoneConfigs] = useState([]);
const [selectedPhoneOrigin, setSelectedPhoneOrigin] = useState('auto');

// Buscar números configurados
const loadPhoneConfigs = async () => {
  const configs = await apiService.getPhoneConfigs();
  setPhoneConfigs(configs);
};

<View style={styles.phoneSelector}>
  <Text style={styles.label}>Número:</Text>
  <Picker
    selectedValue={selectedPhoneOrigin}
    onValueChange={setSelectedPhoneOrigin}
  >
    <Picker.Item label="Auto" value="auto" />
    {phoneConfigs.map(config => (
      <Picker.Item 
        key={config._id}
        label={`${config.name} (${config.phone_number})`}
        value={config._id}
      />
    ))}
  </Picker>
</View>
```

---

### **3. Picker de Emojis:**

```typescript
import EmojiPicker from 'rn-emoji-keyboard';

const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

<TouchableOpacity onPress={() => setEmojiPickerOpen(true)}>
  <Ionicons name="happy-outline" size={24} color="#6366f1" />
</TouchableOpacity>

<EmojiPicker
  onEmojiSelected={(emoji) => {
    setMessageInput(messageInput + emoji.emoji);
  }}
  open={emojiPickerOpen}
  onClose={() => setEmojiPickerOpen(false)}
/>
```

**Dependência:**
```bash
npm install rn-emoji-keyboard
```

---

### **4. Anexos de Arquivos:**

```typescript
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const [attachments, setAttachments] = useState<any[]>([]);

// Selecionar imagem
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsMultipleSelection: true,
    quality: 1,
  });
  
  if (!result.canceled) {
    setAttachments([...attachments, ...result.assets]);
  }
};

// Selecionar documento
const pickDocument = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    multiple: true,
  });
  
  if (!result.canceled) {
    setAttachments([...attachments, ...result.assets]);
  }
};

<View style={styles.attachmentButtons}>
  <TouchableOpacity onPress={pickImage}>
    <Ionicons name="image-outline" size={24} color="#6366f1" />
  </TouchableOpacity>
  <TouchableOpacity onPress={pickDocument}>
    <Ionicons name="document-outline" size={24} color="#6366f1" />
  </TouchableOpacity>
</View>
```

**Dependências:**
```bash
npm install expo-document-picker expo-image-picker
```

---

### **5. Gravação e Transcrição de Áudio:**

```typescript
import { Audio } from 'expo-av';

const [recording, setRecording] = useState<Audio.Recording | null>(null);
const [isRecording, setIsRecording] = useState(false);

// Iniciar gravação
const startRecording = async () => {
  try {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    
    setRecording(recording);
    setIsRecording(true);
  } catch (err) {
    console.error('Erro ao iniciar gravação:', err);
  }
};

// Parar gravação e transcrever
const stopRecording = async () => {
  if (!recording) return;
  
  setIsRecording(false);
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  
  // Transcrever
  await transcribeAudio(uri);
  setRecording(null);
};

// Transcrever áudio
const transcribeAudio = async (audioUri: string) => {
  try {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/wav',
      name: 'recording.wav',
    } as any);
    formData.append('language', 'pt');

    const response = await fetch(
      'https://api-now.sistemasnow.com.br/api/agents/audio-transcription',
      {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (result.success && result.data?.transcription) {
      setMessageInput(messageInput + ' ' + result.data.transcription);
    }
  } catch (error) {
    console.error('Erro na transcrição:', error);
  }
};

<TouchableOpacity 
  onPress={isRecording ? stopRecording : startRecording}
  style={[styles.recordButton, isRecording && styles.recordingActive]}
>
  <Ionicons 
    name={isRecording ? "stop-circle" : "mic-outline"} 
    size={24} 
    color={isRecording ? "#ef4444" : "#6366f1"} 
  />
</TouchableOpacity>
```

---

### **6. Agendamento de Mensagens:**

```typescript
const [showScheduleModal, setShowScheduleModal] = useState(false);
const [scheduleDate, setScheduleDate] = useState(new Date());
const [scheduleTime, setScheduleTime] = useState(new Date());

// Agendar mensagem
const scheduleMessage = async () => {
  // Converter data para formato YYYYMMDD
  const dateInteger = parseInt(
    scheduleDate.toISOString().split('T')[0].replace(/-/g, '')
  );
  
  // Converter hora para decimal (HH.MM)
  const hours = scheduleTime.getHours();
  const minutes = scheduleTime.getMinutes();
  const timeDecimal = hours + (minutes / 60);
  
  const scheduleData = {
    date: dateInteger,
    hour: timeDecimal,
    content: messageInput,
    platform: selectedPlatform === 'auto' ? contact.platform : selectedPlatform,
    phone_origin: selectedPhoneOrigin === 'auto' ? undefined : selectedPhoneOrigin,
    phone: contact.phone,
    client_id: contact._id,
    status: 1, // Ativo
  };
  
  await apiService.createSchedule(scheduleData);
  setShowScheduleModal(false);
  setMessageInput('');
};

<Modal visible={showScheduleModal}>
  <View style={styles.scheduleModal}>
    <Text style={styles.modalTitle}>Agendar Mensagem</Text>
    
    <DateTimePicker
      value={scheduleDate}
      mode="date"
      onChange={(e, date) => setScheduleDate(date || new Date())}
    />
    
    <DateTimePicker
      value={scheduleTime}
      mode="time"
      onChange={(e, time) => setScheduleTime(time || new Date())}
    />
    
    <TouchableOpacity onPress={scheduleMessage}>
      <Text>Agendar</Text>
    </TouchableOpacity>
  </View>
</Modal>
```

**Dependência:**
```bash
npm install @react-native-community/datetimepicker
```

---

## 📦 Dependências Necessárias:

```bash
npm install rn-emoji-keyboard expo-document-picker expo-image-picker @react-native-community/datetimepicker @react-native-picker/picker
```

---

## 🎨 Estilos:

```typescript
const styles = StyleSheet.create({
  // ... estilos existentes
  
  // Botões de ação
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  
  actionButton: {
    padding: 8,
  },
  
  // Seletores
  platformSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32, // ← PADDING INFERIOR
    gap: 8,
  },
  
  // Gravação
  recordButton: {
    padding: 8,
  },
  
  recordingActive: {
    backgroundColor: '#fee2e2',
    borderRadius: 20,
  },
});
```

---

## 🧪 Testar:

```bash
npx expo start --clear
```

**Verificar:**
1. ✅ Seletor de plataforma funciona
2. ✅ Seletor de número funciona
3. ✅ Picker de emojis abre
4. ✅ Anexos funcionam
5. ✅ Gravação de áudio funciona
6. ✅ Transcrição funciona
7. ✅ Agendamento funciona
8. ✅ Padding inferior correto

---

**Implementação completa de envio de mensagens! 🎉**
