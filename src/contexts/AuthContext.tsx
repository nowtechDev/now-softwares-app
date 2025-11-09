import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { notificationService } from '../services/notificationService';

interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  company_id: string;
  sysadmin?: boolean;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      setIsLoading(true);
      const isAuthenticated = await apiService.checkAuthStatus();
      
      if (isAuthenticated) {
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Check auth status error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const { user: loggedUser } = await apiService.login(email, password);
      setUser(loggedUser);
      
      // Registrar push token após login bem-sucedido
      try {
        const pushToken = await notificationService.registerForPushNotificationsAsync();
        if (pushToken && loggedUser._id) {
          await apiService.updatePushToken(loggedUser._id, pushToken);
          console.log('✅ Push token registrado com sucesso');
        }
      } catch (pushError) {
        console.error('⚠️ Erro ao registrar push token (não crítico):', pushError);
        // Não falhar o login por erro no push
      }
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Mesmo com erro, limpa o usuário
      setUser(null);
    }
  }

  async function refreshUser() {
    try {
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
