# 📱 Tela de Minha Conta - Instalação

## ✅ O que foi criado:

### Tela de Conta Completa:
- ✅ `src/screens/AccountScreen.tsx`
- ✅ Editar nome, sobrenome, email, telefone
- ✅ Alterar senha (atual, nova, confirmar)
- ✅ Botão de Logout
- ✅ Avatar e informações do usuário
- ✅ Validações completas
- ✅ Design moderno

### Navegação:
- ✅ Botão de perfil no Dashboard (ícone do usuário)
- ✅ Clica → Abre tela de Minha Conta
- ✅ Botão voltar para Dashboard

## 🚀 Instalação:

### 1. Instalar dependência do Stack Navigator:

```bash
cd c:\Projetos\NowCRM\NowSoftwareApp\NowSoftwaresApp

npx expo install @react-navigation/native-stack
```

### 2. Reiniciar o app:

```bash
# Parar o servidor (Ctrl+C)
# Depois:
npm start
```

## 🎨 Funcionalidades da Tela:

### Informações Pessoais:
- **Nome** * (obrigatório)
- **Sobrenome**
- **Email** * (obrigatório com validação)
- **Telefone** (formato: (00) 00000-0000)

### Alterar Senha:
- **Senha Atual** (obrigatório para alterar)
- **Nova Senha** (mínimo 6 caracteres)
- **Confirmar Nova Senha** (deve coincidir)
- Deixe em branco se não quiser alterar

### Ações:
- **Salvar Alterações** - Atualiza perfil
- **Sair da Conta** - Logout com confirmação

## 🔄 Como Usar:

### 1. Acessar:
- Dashboard → Clicar no ícone de usuário (canto superior direito)

### 2. Editar Perfil:
- Alterar campos desejados
- Clicar em "Salvar Alterações"
- Mensagem de sucesso aparece

### 3. Alterar Senha:
- Preencher "Senha Atual"
- Preencher "Nova Senha"
- Confirmar a nova senha
- Clicar em "Salvar Alterações"

### 4. Fazer Logout:
- Clicar em "Sair da Conta"
- Confirmar no alerta
- Retorna para tela de login

## 🎯 Registro de Push Token:

**IMPORTANTE:** Ao fazer logout e login novamente:
- ✅ O app vai pedir permissão de notificações
- ✅ Gerar novo push token
- ✅ Salvar automaticamente no backend

**Isso resolve o problema do push token!**

## 📊 Fluxo Completo:

```
Dashboard
  ↓ Clica no ícone de usuário
Tela de Conta
  ↓ Campos preenchidos automaticamente
  
Opção 1: Editar perfil
  ↓ Alterar campos
  ↓ Salvar
  ✅ Sucesso!
  
Opção 2: Alterar senha
  ↓ Senha atual + Nova senha
  ↓ Salvar
  ✅ Senha alterada!
  
Opção 3: Logout
  ↓ Clicar "Sair da Conta"
  ↓ Confirmar
  ✅ Volta para login
  ✅ Ao fazer login de novo → Registra push token ✅
```

## 🔧 API Endpoints Usados:

- `GET /api/users/me` - Buscar dados do usuário
- `PATCH /api/users/:id` - Atualizar perfil
- `POST /api/updatePushToken` - Registrar token (no login)

## 🎉 Pronto!

Após instalar a dependência e reiniciar:
1. Acesse o Dashboard
2. Clique no ícone de usuário
3. Faça logout
4. Faça login novamente
5. Push token será registrado! 📱

---

**Comando rápido:**
```bash
cd c:\Projetos\NowCRM\NowSoftwareApp\NowSoftwaresApp
npx expo install @react-navigation/native-stack
npm start
```
