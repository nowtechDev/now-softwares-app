import * as io from 'socket.io-client';

const SOCKET_URL = 'https://api-now.sistemasnow.com.br';

class SocketService {
  private socket: any = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) {
      console.log('🔌 Socket já conectado:', this.socket.id);
      return;
    }

    console.log('🔌 Conectando ao socket...', SOCKET_URL);

    // Socket.IO puro - versão 2.4.0 (igual ao projeto que funciona)
    this.socket = io.connect(SOCKET_URL);

    console.log('🔌 Socket criado, aguardando conexão...');
    console.log('🔧 Configurações:', {
      transports: ['polling', 'websocket'],
      path: '/socket.io/',
      url: SOCKET_URL,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket conectado:', this.socket?.id);
      console.log('🔌 Transport usado:', this.socket?.io?.engine?.transport?.name);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket desconectado:', reason);
      console.log('🔍 Detalhes da desconexão:', {
        reason,
        connected: this.socket?.connected,
        disconnected: this.socket?.disconnected,
      });
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Erro de conexão socket:', error.message);
      console.error('🔍 Detalhes do erro:', {
        message: error.message,
        type: error.type,
        description: error.description,
      });
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ Erro socket:', error);
    });

    // Reconectar automaticamente
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 Socket reconectado após', attemptNumber, 'tentativas');
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('🔄 Tentando reconectar socket...', attemptNumber);
    });

    this.socket.on('reconnect_error', (error: any) => {
      console.error('❌ Erro ao reconectar:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Falha ao reconectar após múltiplas tentativas');
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Desconectando socket...');
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  on(event: string, callback: Function) {
    if (!this.socket) {
      console.warn('⚠️ Socket não conectado. Conectando...');
      this.connect();
    }

    // Adicionar listener direto no socket - igual ao projeto que funciona
    this.socket?.on(event, (...args: any[]) => {
      console.log(`📥 Evento recebido: ${event}`, args);
      callback(...args);
    });

    // Armazenar para poder remover depois
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    console.log(`👂 Listener adicionado para evento: ${event}`);
    console.log(`🔌 Socket conectado?`, this.socket?.connected);
  }

  off(event: string, callback?: Function) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback as any);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }

    console.log(`🔇 Listener removido para evento: ${event}`);
  }

  emit(event: string, data: any) {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket não conectado. Não é possível emitir evento:', event);
      return;
    }

    this.socket.emit(event, data);
    console.log(`📤 Evento emitido: ${event}`, data);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): any {
    return this.socket;
  }
}

export const socketService = new SocketService();
