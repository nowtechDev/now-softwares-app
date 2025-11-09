import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configurar comportamento padrão das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  // Solicitar permissões e obter token
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        alert('Falha ao obter permissão para notificações push!');
        return null;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        
        if (projectId) {
          // Produção: usa projectId do EAS
          token = (await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          })).data;
          console.log('📱 Push Token (Production):', token);
        } else {
          // Desenvolvimento: tenta sem projectId (apenas para testes locais)
          console.warn('⚠️ Sem projectId configurado - usando token de desenvolvimento');
          console.warn('⚠️ Configure o projectId no app.json para produção!');
          token = (await Notifications.getExpoPushTokenAsync()).data;
          console.log('📱 Push Token (Development):', token);
        }
      } catch (error: any) {
        console.error('❌ Erro ao obter push token:', error.message);
        alert('Erro ao registrar notificações. Configure o projectId no app.json');
        return null;
      }
    } else {
      alert('É necessário um dispositivo físico para notificações push');
    }

    this.expoPushToken = token || null;
    return token;
  }

  // Obter token salvo
  getToken() {
    return this.expoPushToken;
  }

  // Agendar notificação local
  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Date | number
  ) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
        },
        trigger:
          typeof trigger === 'number'
            ? { seconds: trigger }
            : { date: trigger },
      });

      console.log('✅ Notificação agendada:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ Erro ao agendar notificação:', error);
      throw error;
    }
  }

  // Enviar notificação imediata
  async sendImmediateNotification(title: string, body: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      throw error;
    }
  }

  // Cancelar notificação
  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('✅ Notificação cancelada:', notificationId);
    } catch (error) {
      console.error('❌ Erro ao cancelar notificação:', error);
      throw error;
    }
  }

  // Cancelar todas as notificações
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ Todas as notificações canceladas');
    } catch (error) {
      console.error('❌ Erro ao cancelar notificações:', error);
      throw error;
    }
  }

  // Obter todas as notificações agendadas
  async getAllScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('❌ Erro ao obter notificações:', error);
      return [];
    }
  }

  // Listeners de notificações
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();
