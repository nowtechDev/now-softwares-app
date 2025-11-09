# NowSoftwaresApp - CRM Mobile

Aplicativo móvel React Native do sistema NowCRM com funcionalidades principais do sistema web.

## 📱 Funcionalidades Implementadas

### ✅ Primeira Fase (Concluída)

- **Login com Persistência**: Autenticação integrada com a API do sistema web
- **Dashboard Principal**: 
  - Cards de atalhos rápidos para páginas principais
  - KPIs informativos (Total de Clientes, Receita, Taxa de Conversão)
  - Atividades recentes
  - Próximos eventos do calendário
  - Pull-to-refresh
- **Menu Drawer**: Navegação lateral similar ao sistema web
- **Estrutura de Páginas**:
  - Chat / Omnichannel (estrutura criada)
  - Calendário (estrutura criada)
  - Lembretes (estrutura criada)
  - Kanban (estrutura criada)
  - Financeiro (estrutura criada)

### 🚧 Próximas Fases

1. **Chat/Omnichannel**: Implementar funcionalidades completas do omnichannel web
2. **Calendário**: Agenda completa com eventos
3. **Lembretes**: Sistema de notificações e lembretes
4. **Kanban**: Quadro de tarefas interativo
5. **Financeiro**: Módulo completo de gestão financeira

## 🚀 Como Executar

### Pré-requisitos

- Node.js 16+
- Expo CLI
- Dispositivo físico ou emulador Android/iOS

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar o app
npm start

# Executar no Android
npm run android

# Executar no iOS
npm run ios
```

## 📦 Dependências Principais

- **React Native** + **Expo**: Framework base
- **React Navigation**: Navegação (Drawer + Stack)
- **AsyncStorage**: Persistência local
- **Axios**: Requisições HTTP
- **Expo Vector Icons**: Ícones

## 🔧 Configuração da API

O app está configurado para se conectar à mesma API do sistema web:

```typescript
const API_BASE_URL = 'https://api-now.sistemasnow.com.br/api';
```

## 📂 Estrutura de Pastas

```
src/
├── contexts/
│   └── AuthContext.tsx      # Contexto de autenticação
├── navigation/
│   └── AppNavigator.tsx     # Navegação principal
├── screens/
│   ├── LoginScreen.tsx      # Tela de login
│   ├── DashboardScreen.tsx  # Dashboard principal
│   ├── ChatScreen.tsx       # Chat/Omnichannel
│   ├── CalendarScreen.tsx   # Calendário
│   ├── RemindersScreen.tsx  # Lembretes
│   ├── KanbanScreen.tsx     # Kanban
│   └── FinancialScreen.tsx  # Financeiro
└── services/
    └── api.ts              # Serviço de API
```

## 🎨 Design

O app segue o mesmo padrão visual do sistema web:
- Cor primária: `#6366f1` (Indigo)
- Design moderno e clean
- Totalmente responsivo
- Dark mode preparado

## 👥 Desenvolvimento

Desenvolvido pela equipe Now Softwares como versão mobile do sistema CRM web.

## 📄 Licença

Propriedade da Now Softwares © 2024
