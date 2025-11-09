# ✅ Implementação de Mídias no Chat - Seguindo Padrão Web

## 🎯 Objetivo:

Implementar visualização de mídias (imagem, vídeo, áudio, documento) com:
- ✅ Skeleton loading (ghost/placeholder enquanto carrega)
- ✅ Thumbnails do mesmo tamanho da mídia final
- ✅ Scroll começando no final (mensagens antigas no topo)
- ✅ Carregar mídias de forma progressiva (sem travar a UI)

---

## 📦 Dependências Necessárias:

```bash
npm install expo-av
```

**Por quê?**
- `expo-av`: Para reproduzir áudio e vídeo no React Native

---

## 🏗️ Arquitetura (Conforme Web):

### 1. **MediaSkeleton Component** ✅

**Localização:** `src/components/MediaSkeleton.tsx`

```typescript
interface MediaSkeletonProps {
  type: 'image' | 'video' | 'audio' | 'document';
  width?: number;
  height?: number;
}

export function MediaSkeleton({ type, width, height }) {
  // Renderiza um placeholder animado específico para cada tipo
  // - Imagem: Retângulo cinza com ícone de imagem
  // - Vídeo: Retângulo escuro com botão de play
  // - Áudio: Barra horizontal com ícone de música e formas de onda fake
  // - Documento: Card com ícone de documento e linhas de texto fake
}
```

**Benefícios:**
- ✅ UX profissional (usuário sabe que está carregando)
- ✅ Evita "jump" de layout (tamanho fixo desde o início)
- ✅ Visual consistente com WhatsApp/Telegram

---

### 2. **Sistema de Loading States** ✅

**Como funciona:**

```typescript
// Estado para controlar loading de cada URL de mídia
const [mediaLoadingStates, setMediaLoadingStates] = useState<Record<string, boolean>>({});

// Marcar como loading
const setMediaLoading = (url: string, isLoading: boolean) => {
  setMediaLoadingStates(prev => ({
    ...prev,
    [url]: isLoading
  }));
};

// Verificar se está loading
const isMediaLoading = (url: string) => {
  return mediaLoadingStates[url] || false;
};
```

**Eventos de controle:**

```typescript
<Image
  source={{ uri: url }}
  onLoadStart={() => setMediaLoading(url, true)}   // ⏳ Começou a carregar
  onLoad={() => setMediaLoading(url, false)}        // ✅ Terminou de carregar
  onError={() => setMediaLoading(url, false)}       // ❌ Erro ao carregar
/>
```

---

### 3. **MediaMessage Component**

**Responsável por:**
- Renderizar cada tipo de mídia (imagem, vídeo, áudio, documento)
- Mostrar skeleton enquanto carrega
- Esconder skeleton quando carregar
- Permitir interação (abrir fullscreen, reproduzir, download)

```typescript
const MediaMessage = ({ item, isUser }: { item: Message; isUser: boolean }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const mediaWidth = screenWidth * 0.65; // 65% da tela
  const mediaHeight = mediaWidth * 0.75; // Proporção 4:3

  if (!item.hasMedia || !item.link) return null;

  // Renderizar imagem, vídeo, áudio ou documento
  // Com skeleton absoluto sobreposto
};
```

---

## 🎨 Estrutura Visual:

### **Imagem/Vídeo:**

```
┌────────────────────────────┐
│                            │
│  [MediaSkeleton]           │  ← Absolutamente posicionado
│  (opacity: 1)              │
│                            │
└────────────────────────────┘
        ↓ (loading)
┌────────────────────────────┐
│                            │
│  [Image/Video]             │  ← Aparece gradualmente
│  (opacity: 0 → 1)          │
│                            │
└────────────────────────────┘
```

**CSS:**
```typescript
{/* Skeleton */}
{!imageLoaded && (
  <View style={[styles.mediaSkeleton, { width, height }]}>
    <MediaSkeleton type="image" width={width} height={height} />
  </View>
)}

{/* Mídia real */}
<Image
  source={{ uri: item.link }}
  style={[
    styles.mediaImage,
    { width, height },
    { opacity: imageLoaded ? 1 : 0 } // Fade in
  ]}
  onLoadStart={() => setImageLoaded(false)}
  onLoad={() => setImageLoaded(true)}
/>
```

---

## 📜 FlatList Invertida (Scroll no Final):

### **Problema:**
```typescript
// ❌ ERRADO: Começa no topo e vai descendo
<FlatList
  data={messages}
  renderItem={renderMessage}
/>
```

**Resultado:** Usuário vê as mensagens carregando de cima para baixo (ruim!)

### **Solução:**
```typescript
// ✅ CORRETO: Começa no final (como WhatsApp)
<FlatList
  data={messages}
  renderItem={renderMessage}
  inverted={true}  // 🔑 Inverte a lista
  maintainVisibleContentPosition={{
    minIndexForVisible: 0,
    autoscrollToTopThreshold: 10,
  }}
/>
```

**Como funciona:**
1. `inverted={true}` → Lista fica de cabeça para baixo
2. Mensagens mais antigas ficam "no topo" (visualmente embaixo)
3. Scroll inicial automático no "topo" (visualmente final)
4. `maintainVisibleContentPosition` → Mantém posição ao carregar mais

**Benefício:**
- ✅ Usuário NÃO vê conteúdo carregando
- ✅ Scroll já começa no final (mensagens recentes)
- ✅ Carregamento progressivo invisível

---

## 🔄 Ordem das Mensagens:

```typescript
// Backend retorna: [ msg_recente, msg_antiga ] (ordem decrescente)

// ✅ Inverter para ordem crescente
const sortedMessages = formattedMessages.reverse();

// ✅ FlatList inverted faz o resto
<FlatList data={sortedMessages} inverted={true} />

// RESULTADO VISUAL:
// Topo (scroll para cima)    ← msg_antiga
// ...
// Final (scroll inicial aqui) ← msg_recente
```

---

## 📱 Tipos de Mídia:

### 1. **Imagem:**
```typescript
<Pressable onPress={() => openFullscreen(item.link)}>
  <View style={{ width: mediaWidth, height: mediaHeight }}>
    {!imageLoaded && <MediaSkeleton type="image" />}
    <Image
      source={{ uri: item.link }}
      style={{ width: mediaWidth, height: mediaHeight }}
      onLoadStart={() => setImageLoaded(false)}
      onLoad={() => setImageLoaded(true)}
    />
  </View>
</Pressable>
```

### 2. **Vídeo:**
```typescript
<View style={{ width: mediaWidth, height: mediaHeight }}>
  {!videoLoaded && <MediaSkeleton type="video" />}
  <Video
    source={{ uri: item.link }}
    style={{ width: mediaWidth, height: mediaHeight }}
    useNativeControls
    resizeMode="contain"
    onLoadStart={() => setVideoLoaded(false)}
    onLoad={() => setVideoLoaded(true)}
  />
</View>
```

### 3. **Áudio:**
```typescript
<Pressable onPress={() => playAudio(item.link)}>
  <View style={styles.audioMessage}>
    <Ionicons name="play-circle" size={32} />
    <View>
      <Text>Mensagem de áudio</Text>
      <Text>0:00</Text>
    </View>
  </View>
</Pressable>
```

### 4. **Documento:**
```typescript
<Pressable onPress={() => openDocument(item.link)}>
  <View style={styles.documentMessage}>
    <Ionicons name="document-text" size={32} />
    <View>
      <Text>Documento</Text>
      <Text>Toque para abrir</Text>
    </View>
  </View>
</Pressable>
```

---

## 🎯 Tamanhos Padrão:

```typescript
const screenWidth = Dimensions.get('window').width;
const mediaWidth = screenWidth * 0.65;  // 65% da largura
const mediaHeight = mediaWidth * 0.75;   // Proporção 4:3

// Para imagens/vídeos: 
// - iPhone: ~245px x 184px
// - Android: ~260px x 195px

// Para áudio:
// - Altura fixa: 60px
// - Largura: mediaWidth

// Para documento:
// - Altura fixa: 80px
// - Largura: mediaWidth
```

---

## ✅ Checklist de Implementação:

- [x] Instalar `expo-av`
- [x] Criar componente `MediaSkeleton`
- [ ] Atualizar `ConversationScreen` com:
  - [ ] Estado de loading por URL
  - [ ] Componente `MediaMessage`
  - [ ] FlatList com `inverted={true}`
  - [ ] Estilos para mídias
- [ ] Testar todos os tipos de mídia:
  - [ ] Imagem
  - [ ] Vídeo
  - [ ] Áudio
  - [ ] Documento

---

## 🧪 Como Testar:

1. **Mensagem com imagem:**
   - Enviar imagem via WhatsApp
   - Verificar skeleton aparece primeiro
   - Verificar imagem carrega progressivamente
   - Verificar não há "jump" de layout

2. **Scroll inicial:**
   - Abrir conversa com muitas mensagens
   - Verificar que scroll JÁ está no final
   - Verificar que NÃO mostra carregamento de cima para baixo

3. **Performance:**
   - Abrir conversa com muitas mídias
   - Verificar que app não trava
   - Verificar que skeletons aparecem instantaneamente

---

**Próximo passo:** Aplicar correções no ConversationScreen.tsx
