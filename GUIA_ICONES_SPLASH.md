# 📱 Guia: Personalizar Ícones e Splash Screen

## 🎨 Estrutura de Arquivos

```
NowSoftwaresApp/
├── assets/
│   ├── icon.png          ← Ícone do app (1024x1024)
│   ├── splash.png        ← Splash screen (1284x2778)
│   ├── adaptive-icon.png ← Ícone Android adaptativo (1024x1024)
│   └── favicon.png       ← Favicon web (48x48)
├── app.json              ← Configuração dos ícones
└── android/
    └── app/src/main/res/
        ├── mipmap-hdpi/
        ├── mipmap-mdpi/
        ├── mipmap-xhdpi/
        ├── mipmap-xxhdpi/
        └── mipmap-xxxhdpi/
```

---

## 📐 Tamanhos Recomendados

### 1. **Ícone do App** (`icon.png`)
- **Tamanho**: 1024x1024 pixels
- **Formato**: PNG com transparência
- **Uso**: iOS e Android

### 2. **Splash Screen** (`splash.png`)
- **Tamanho**: 1284x2778 pixels (iPhone 14 Pro Max)
- **Formato**: PNG
- **Cor de fundo**: Definida no `app.json`

### 3. **Ícone Adaptativo Android** (`adaptive-icon.png`)
- **Tamanho**: 1024x1024 pixels
- **Formato**: PNG com transparência
- **Área segura**: 66% do centro (684x684)
- **Uso**: Android 8.0+

### 4. **Ícone de Notificação** (Android)
- **Tamanho**: 96x96 pixels
- **Formato**: PNG monocromático (branco com transparência)
- **Uso**: Notificações push no Android

---

## 🛠️ Passo a Passo

### 1️⃣ Criar os Ícones

#### Ferramentas Online:
- **[Figma](https://figma.com)** - Design profissional
- **[Canva](https://canva.com)** - Templates prontos
- **[Adobe Express](https://express.adobe.com)** - Editor online
- **[Icon Kitchen](https://icon.kitchen)** - Gerador de ícones Android

#### Dicas de Design:
- ✅ Use cores vibrantes e contrastantes
- ✅ Mantenha o design simples e reconhecível
- ✅ Evite texto pequeno (não fica legível)
- ✅ Teste em diferentes tamanhos

---

### 2️⃣ Adicionar os Arquivos

Substitua os arquivos em `assets/`:

```bash
NowSoftwaresApp/assets/
├── icon.png          # Seu novo ícone 1024x1024
├── splash.png        # Seu novo splash 1284x2778
├── adaptive-icon.png # Ícone adaptativo 1024x1024
└── notification-icon.png # Ícone notificação 96x96 (opcional)
```

---

### 3️⃣ Configurar no `app.json`

Abra `app.json` e configure:

```json
{
  "expo": {
    "name": "NowCRM",
    "slug": "now-crm",
    "version": "1.0.0",
    "orientation": "portrait",
    
    // ========== ÍCONE DO APP ==========
    "icon": "./assets/icon.png",
    
    // ========== SPLASH SCREEN ==========
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#6366f1"  // Cor de fundo (indigo)
    },
    
    // ========== iOS ==========
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.nowdigital.crm",
      "icon": "./assets/icon.png"
    },
    
    // ========== ANDROID ==========
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#6366f1"  // Cor de fundo do ícone adaptativo
      },
      "package": "com.nowdigital.crm",
      
      // Ícone de notificação (opcional)
      "notification": {
        "icon": "./assets/notification-icon.png",
        "color": "#6366f1"
      }
    },
    
    // ========== WEB ==========
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

---

### 4️⃣ Gerar Ícones Automaticamente com Expo

O Expo gera automaticamente todos os tamanhos necessários:

```bash
# Limpar cache
npx expo start -c

# Build de desenvolvimento
eas build --profile development --platform android
eas build --profile development --platform ios
```

---

## 🔔 Personalizar Ícone de Notificação Push

### Android

1. **Criar ícone monocromático** (96x96, branco com transparência)
2. **Adicionar em** `assets/notification-icon.png`
3. **Configurar no** `app.json`:

```json
"android": {
  "notification": {
    "icon": "./assets/notification-icon.png",
    "color": "#6366f1"  // Cor de fundo da notificação
  }
}
```

### iOS

O iOS usa automaticamente o ícone do app nas notificações.

---

## 🎨 Cores do Tema

Atualize as cores no `app.json`:

```json
{
  "expo": {
    "primaryColor": "#6366f1",  // Indigo
    "splash": {
      "backgroundColor": "#6366f1"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#6366f1"
      },
      "notification": {
        "color": "#6366f1"
      }
    }
  }
}
```

---

## 🧪 Testar os Ícones

### 1. **Desenvolvimento**:
```bash
npx expo start
```

### 2. **Build Preview**:
```bash
eas build --profile preview --platform android
```

### 3. **Instalar no dispositivo**:
- Baixe o APK/IPA gerado
- Instale no dispositivo
- Verifique ícone, splash e notificações

---

## 📱 Ícone Adaptativo Android

O Android 8.0+ usa ícones adaptativos que podem ter diferentes formas:

```
┌─────────────────┐
│  ╔═══════════╗  │  ← Área total (1024x1024)
│  ║           ║  │
│  ║  ┌─────┐  ║  │  ← Área segura (684x684)
│  ║  │LOGO │  ║  │     Seu logo deve ficar aqui
│  ║  └─────┘  ║  │
│  ║           ║  │
│  ╚═══════════╝  │
└─────────────────┘
```

**Dica**: Mantenha elementos importantes no centro (66% da área).

---

## 🚀 Comandos Úteis

```bash
# Limpar cache do Expo
npx expo start -c

# Gerar ícones automaticamente (se usar expo-splash-screen)
npx expo install expo-splash-screen
npx expo prebuild --clean

# Build de produção
eas build --platform android
eas build --platform ios

# Atualizar OTA (Over-The-Air)
eas update --branch production
```

---

## 📚 Recursos

### Ferramentas de Design:
- **Figma**: https://figma.com
- **Canva**: https://canva.com
- **Icon Kitchen**: https://icon.kitchen
- **App Icon Generator**: https://appicon.co

### Documentação:
- **Expo Icons**: https://docs.expo.dev/guides/app-icons/
- **Expo Splash**: https://docs.expo.dev/guides/splash-screens/
- **Android Adaptive Icons**: https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive

### Inspiração:
- **Dribbble**: https://dribbble.com/tags/app-icon
- **Behance**: https://behance.net/search/projects?search=app+icon

---

## ✅ Checklist Final

- [ ] Ícone do app (1024x1024) criado
- [ ] Splash screen (1284x2778) criado
- [ ] Ícone adaptativo Android (1024x1024) criado
- [ ] Ícone de notificação (96x96) criado (opcional)
- [ ] Arquivos adicionados em `assets/`
- [ ] `app.json` configurado
- [ ] Cores do tema definidas
- [ ] Build de teste gerado
- [ ] Ícones testados no dispositivo
- [ ] Notificações push testadas

---

## 🎨 Exemplo de Configuração Completa

```json
{
  "expo": {
    "name": "NowCRM",
    "slug": "now-crm",
    "version": "1.0.0",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#6366f1"
    },
    "ios": {
      "bundleIdentifier": "com.nowdigital.crm"
    },
    "android": {
      "package": "com.nowdigital.crm",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#6366f1"
      },
      "notification": {
        "icon": "./assets/notification-icon.png",
        "color": "#6366f1"
      }
    }
  }
}
```

---

**Pronto!** 🎉 Seu app agora tem ícones e splash screen personalizados!
