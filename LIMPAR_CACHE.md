# 🔧 Limpar Cache do Metro Bundler

## ❌ Erro:
```
Expected corresponding JSX closing tag for <View>
```

## ✅ Solução:

### Passo 1: Parar o servidor
```bash
# Pressione Ctrl+C no terminal onde o Metro está rodando
```

### Passo 2: Limpar cache
```bash
cd c:\Projetos\NowCRM\NowSoftwareApp\NowSoftwaresApp

# Limpar cache do Metro
npx expo start --clear

# OU limpar cache completo
npx expo start -c
```

### Passo 3: Se ainda der erro, deletar cache manualmente
```bash
# Parar o servidor (Ctrl+C)

# Limpar node_modules/.cache
rm -rf node_modules/.cache

# OU no PowerShell:
Remove-Item -Recurse -Force node_modules\.cache

# Reiniciar
npx expo start
```

---

## 🔄 Comandos Úteis:

### Limpar e reiniciar:
```bash
# PowerShell
npx expo start --clear
```

### Reset completo (se necessário):
```bash
# 1. Parar servidor
# 2. Deletar cache
Remove-Item -Recurse -Force node_modules\.cache
# 3. Reiniciar
npx expo start
```

---

## ✅ Arquivo Correto Agora:

O `NotificationsStatusScreen.tsx` já está correto:

```tsx
return (
  <View style={styles.container}>  ← Abertura
    {/* Conteúdo */}
  </View>  ← Fechamento correspondente ✅
);
```

**O erro é só cache do Metro!**

---

## 🚀 Comando Rápido:

```bash
npx expo start --clear
```

**Isso deve resolver! 🎉**
