# 📱 Guia de Instalação - NowSoftwaresApp

## ✅ O que já foi criado

A estrutura completa do aplicativo React Native foi criada com:

1. **Autenticação**:
   - Login com email e senha
   - Persistência de sessão com AsyncStorage
   - Integração com a mesma API do sistema web

2. **Dashboard**:
   - Cards de atalhos para 5 páginas principais
   - 3 Cards de KPIs (Clientes, Receita, Conversão)
   - Atividades recentes
   - Próximos eventos do calendário

3. **Navegação**:
   - Drawer Menu similar ao sistema web
   - 6 telas configuradas (Dashboard + 5 páginas)

4. **Estrutura de Páginas** (prontas para desenvolvimento):
   - Chat/Omnichannel
   - Calendário
   - Lembretes
   - Kanban
   - Financeiro

## 🚀 Como Executar o App

### Passo 1: Verificar dependências instaladas

```bash
cd c:\Projetos\NowCRM\NowSoftwareApp\NowSoftwaresApp
npm install
```

### Passo 2: Iniciar o Expo

```bash
npm start
```

Isso abrirá o Expo Dev Tools no navegador.

### Passo 3: Executar no dispositivo

**Opção A - Dispositivo Físico:**
1. Instale o app "Expo Go" na Play Store/App Store
2. Escaneie o QR Code mostrado no terminal/navegador

**Opção B - Emulador Android:**
```bash
npm run android
```

**Opção C - Simulador iOS (apenas Mac):**
```bash
npm run ios
```

## 📦 Dependências Instaladas

### Principais:
- `@react-navigation/native` - Navegação
- `@react-navigation/native-stack` - Stack Navigator
- `@react-navigation/drawer` - Drawer Menu
- `react-native-screens` - Otimização de telas
- `react-native-safe-area-context` - Safe areas
- `@react-native-async-storage/async-storage` - Storage persistente
- `axios` - Requisições HTTP
- `@expo/vector-icons` - Ícones
- `react-native-gesture-handler` - Gestos
- `react-native-reanimated` - Animações

## 🔧 Configuração

### API Endpoint

O app está configurado para usar a API de produção:
```
https://api-now.sistemasnow.com.br/api
```

Para mudar para ambiente local (desenvolvimento), edite:
```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:3030/api';
```

### Credenciais de Teste

Use as mesmas credenciais do sistema web para fazer login.

## 📂 Arquivos Criados

```
NowSoftwaresApp/
├── App.tsx                      ✅ App principal
├── babel.config.js              ✅ Configuração Babel
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx      ✅ Contexto de autenticação
│   ├── services/
│   │   └── api.ts               ✅ Cliente da API
│   ├── navigation/
│   │   └── AppNavigator.tsx     ✅ Navegação + Drawer
│   └── screens/
│       ├── LoginScreen.tsx      ✅ Tela de login
│       ├── DashboardScreen.tsx  ✅ Dashboard completo
│       ├── ChatScreen.tsx       ✅ Placeholder
│       ├── CalendarScreen.tsx   ✅ Placeholder
│       ├── RemindersScreen.tsx  ✅ Placeholder
│       ├── KanbanScreen.tsx     ✅ Placeholder
│       └── FinancialScreen.tsx  ✅ Placeholder
```

## ✅ Testando o App

1. **Login**: Use credenciais válidas do sistema web
2. **Dashboard**: Veja os cards de atalhos e KPIs
3. **Menu Drawer**: Arraste da esquerda ou clique no ícone ☰
4. **Navegação**: Teste todas as páginas do menu
5. **Logout**: Use o botão "Sair" no final do menu

## 🎨 Personalização

### Cores do Tema

As cores principais estão definidas inline nos componentes:
- Primária: `#6366f1` (Indigo)
- Verde: `#10b981`
- Azul: `#3b82f6`
- Laranja: `#f59e0b`
- Roxo: `#8b5cf6`
- Vermelho: `#ef4444`

### Ícones

Usando `@expo/vector-icons` (Ionicons):
- [Lista completa de ícones](https://ionic.io/ionicons)

## 🐛 Troubleshooting

### Erro de módulo não encontrado
```bash
npm install
npx expo start -c  # Limpa cache
```

### App não conecta na API
- Verifique se a API está online
- Teste o endpoint no navegador: `https://api-now.sistemasnow.com.br/api`
- Para localhost no Android, use: `http://10.0.2.2:3030/api`

### Erro no Reanimated
```bash
npx expo start -c
```

### Limpar tudo e reinstalar
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🚧 Próximos Passos

Após testar e validar esta primeira versão:

1. **Chat/Omnichannel**: Migrar funcionalidades do sistema web
2. **Calendário**: Implementar agenda completa
3. **Lembretes**: Sistema de notificações
4. **Kanban**: Quadro interativo de tarefas
5. **Financeiro**: Módulo completo

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação do Expo:
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

---

**Desenvolvido por Now Softwares © 2024**
