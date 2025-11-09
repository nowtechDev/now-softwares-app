import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { notificationService } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Inicializar notificações push
    notificationService.registerForPushNotificationsAsync();

    // Listener para notificações recebidas
    const receivedListener = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notificação recebida:', notification);
      }
    );

    // Listener para quando usuário toca na notificação
    const responseListener = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notificação tocada:', response);
      }
    );

    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
