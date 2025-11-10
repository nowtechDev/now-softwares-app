import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';

/**
 * Serviço para lidar com navegação via notificações push
 */
class NotificationNavigationService {
  private navigationRef: NavigationContainerRef<any> | null = null;

  /**
   * Registrar referência de navegação
   */
  setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
  }

  /**
   * Configurar listeners de notificações
   */
  setupNotificationListeners() {
    // Listener para quando o app está em foreground e notificação é tocada
    const foregroundSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('📱 [Notification] Notificação tocada (foreground):', response);
        this.handleNotificationResponse(response);
      }
    );

    // Listener para quando o app é aberto via notificação (background/closed)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log('📱 [Notification] App aberto via notificação:', response);
        this.handleNotificationResponse(response);
      }
    });

    return () => {
      foregroundSubscription.remove();
    };
  }

  /**
   * Processar resposta da notificação e navegar
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    
    console.log('🔍 [Notification] Data recebida:', data);

    if (!this.navigationRef) {
      console.warn('⚠️ [Notification] NavigationRef não está configurado');
      return;
    }

    // Navegar baseado no tipo de notificação
    if (data.type === 'chat_message') {
      this.navigateToChat(data);
    } else if (data.type === 'task_reminder') {
      this.navigateToTask(data);
    } else if (data.type === 'calendar_event') {
      this.navigateToCalendar(data);
    } else {
      // Navegação padrão para home
      this.navigateToHome();
    }
  }

  /**
   * Navegar para tela de chat
   */
  private navigateToChat(data: any) {
    console.log('💬 [Notification] Navegando para chat:', data);
    
    if (data.client_id && data.client_name) {
      this.navigationRef?.navigate('Conversation', {
        clientId: data.client_id,
        clientName: data.client_name,
        clientPhone: data.client_phone || '',
      });
    } else {
      // Se não tem dados do cliente, vai para lista de conversas
      this.navigationRef?.navigate('Chats');
    }
  }

  /**
   * Navegar para tela de tarefa
   */
  private navigateToTask(data: any) {
    console.log('✅ [Notification] Navegando para tarefa:', data);
    
    this.navigationRef?.navigate('Tasks', {
      taskId: data.task_id,
      highlightTask: true,
    });
  }

  /**
   * Navegar para tela de calendário
   */
  private navigateToCalendar(data: any) {
    console.log('📅 [Notification] Navegando para calendário:', data);
    
    this.navigationRef?.navigate('Calendar', {
      eventId: data.event_id,
      date: data.event_date,
    });
  }

  /**
   * Navegar para home
   */
  private navigateToHome() {
    console.log('🏠 [Notification] Navegando para home');
    this.navigationRef?.navigate('Home');
  }
}

export default new NotificationNavigationService();
