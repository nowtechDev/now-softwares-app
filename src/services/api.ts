import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// URL da API - Mesma do sistema web
const API_BASE_URL = 'https://api-now.sistemasnow.com.br/api';
const DEFAULT_COMPANY_ID = '6661b9a825ae52dd3b9c1981';

interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  company_id: string;
  sysadmin?: boolean;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

interface DashboardStats {
  totalClients: number;
  activeProspects: number;
  monthlyRevenue: number;
  conversionRate: number;
}

export interface Reminder {
  _id: string;
  name: string;
  preview?: string;
  date: number;  // Formato: 20251103
  hour?: string;
  minutes?: string;
  description?: string;
  status: number;
  type_task?: number;
  user_id: string;
  company_id: string;
  createdAt: string;
  updatedAt: string;
  notificationId?: string;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token em todas as requisições
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para tratar erros de autenticação
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Helper para normalizar respostas paginadas do Feathers
  private normalizeFeathersResponse<T>(response: any): T[] {
    // Se for array direto, usa como está (para compatibilidade)
    if (Array.isArray(response)) {
      return response;
    }
    
    // Se for objeto com data (estrutura do Feathers paginado), extrai o array
    if (response && typeof response === 'object' && 'data' in response) {
      return Array.isArray(response.data) ? response.data : [];
    }
    
    // Fallback para array vazio
    return [];
  }

  // Gerenciamento de Token
  async setAccessToken(token: string): Promise<void> {
    this.accessToken = token;
    await AsyncStorage.setItem('access_token', token);
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      this.accessToken = await AsyncStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  async clearToken(): Promise<void> {
    this.accessToken = null;
    await AsyncStorage.multiRemove(['access_token', 'user_data']);
  }

  // Autenticação
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.axiosInstance.post('/auth', {
        email,
        password,
        strategy: 'local'
      });

      const { accessToken, user } = response.data;
      
      await this.setAccessToken(accessToken);
      await AsyncStorage.setItem('user_data', JSON.stringify(user));

      return { accessToken, user };
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post('/authentication/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        return JSON.parse(userData);
      }
      
      // Se não tem no storage, busca da API
      const response = await this.axiosInstance.get('/users/me');
      const user = response.data;
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;

    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  // Clientes (paginado)
  async getClients() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const response = await this.axiosInstance.get('/client', {
        params: {
          company_id: user.company_id,
          $limit: 5000,
          '$sort[name]': 1,
        },
      });
      return this.normalizeFeathersResponse(response.data);
    } catch (error) {
      console.error('Get clients error:', error);
      return [];
    }
  }

  // Propostas (projects com isProposal=true)
  async getProposals() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const response = await this.axiosInstance.get('/project', {
        params: {
          isProposal: true,
          company_id: user.company_id,
          $limit: 5000,
          '$sort[updatedAt]': -1,
        },
      });
      const proposals = this.normalizeFeathersResponse(response.data);
      return proposals.filter((p: any) => p.isProposal === true || p.isProposal === 1);
    } catch (error) {
      console.error('Get proposals error:', error);
      return [];
    }
  }

  // Dashboard Stats (calcula localmente como na web)
  async getDashboardStats(startDate?: Date, endDate?: Date): Promise<DashboardStats> {
    try {
      const [clientsResponse, proposalsResponse] = await Promise.all([
        this.getClients(),
        this.getProposals(),
      ]);

      let clients = clientsResponse;
      let proposals = proposalsResponse;
      
      // Aplicar filtro de data se fornecido
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        clients = clients.filter((client: any) => {
          if (!client.createdAt) return true;
          const clientDate = new Date(client.createdAt);
          return clientDate >= start && clientDate <= end;
        });
        
        proposals = proposals.filter((proposal: any) => {
          if (!proposal.createdAt) return true;
          const proposalDate = new Date(proposal.createdAt);
          return proposalDate >= start && proposalDate <= end;
        });
      }
      
      const totalClients = clients.length;
      const activeProspects = clients.filter((c: any) => c.status === 'prospect').length;
      const approvedProposals = proposals.filter((p: any) => p.status === 3);
      const monthlyRevenue = approvedProposals.reduce((sum: number, p: any) => {
        return sum + (parseFloat(p.hourPrice || 0) * parseFloat(p.hour || 0));
      }, 0);
      const conversionRate = proposals.length > 0 ? (approvedProposals.length / proposals.length) * 100 : 0;

      return {
        totalClients,
        activeProspects,
        monthlyRevenue,
        conversionRate,
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return {
        totalClients: 0,
        activeProspects: 0,
        monthlyRevenue: 0,
        conversionRate: 0,
      };
    }
  }

  // Atividades Recentes (rota não existe no backend, retorna vazio)
  async getRecentActivities(limit: number = 10) {
    try {
      // TODO: Implementar quando rota de atividades estiver disponível
      // Por enquanto, retorna array vazio para não quebrar o Dashboard
      return [];
    } catch (error) {
      console.error('Get recent activities error:', error);
      return [];
    }
  }

  // Status de Projetos
  async getProjectsStatus() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const response = await this.axiosInstance.get('/project', {
        params: {
          company_id: user.company_id,
          $limit: 50,
          '$sort[updatedAt]': -1,
        },
      });
      return this.normalizeFeathersResponse(response.data);
    } catch (error) {
      console.error('Get projects status error:', error);
      return [];
    }
  }

  // Tarefas Kanban
  async getKanbanTasks() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const response = await this.axiosInstance.get('/tasks', {
        params: {
          company_id: user.company_id,
          $limit: 100,
          '$sort[createdAt]': -1,
        },
      });
      return this.normalizeFeathersResponse(response.data);
    } catch (error) {
      console.error('Get kanban tasks error:', error);
      return [];
    }
  }

  // Transações Financeiras
  async getFinancialTransactions(params?: any) {
    try {
      const response = await this.axiosInstance.get('/financial-transactions', {
        params: {
          $limit: 50,
          $sort: { date: -1 },
          ...params,
        },
      });
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    } catch (error) {
      console.error('Get financial transactions error:', error);
      return [];
    }
  }

  // Calendar/Eventos
  async getCalendarEvents(startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const params: any = {
        company_id: user.company_id,
        $limit: 100,
        '$sort[startDateTime]': 1,
      };
      
      if (startDate || endDate) {
        params.startDateTime = {};
        if (startDate) params.startDateTime.$gte = startDate.toISOString();
        if (endDate) params.startDateTime.$lte = endDate.toISOString();
      }

      const response = await this.axiosInstance.get('/calendar', { params });
      return this.normalizeFeathersResponse<any>(response.data);
    } catch (error) {
      console.error('Get calendar events error:', error);
      return [];
    }
  }

  async createCalendarEvent(eventData: any) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not found');

      const response = await this.axiosInstance.post('/calendar', {
        ...eventData,
        company_id: user.company_id,
      });
      return response.data;
    } catch (error) {
      console.error('Create calendar event error:', error);
      throw error;
    }
  }

  async updateCalendarEvent(id: string, eventData: any) {
    try {
      const response = await this.axiosInstance.patch(`/calendar/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error('Update calendar event error:', error);
      throw error;
    }
  }

  async deleteCalendarEvent(id: string) {
    try {
      await this.axiosInstance.delete(`/calendar/${id}`);
    } catch (error) {
      console.error('Delete calendar event error:', error);
      throw error;
    }
  }

  // Tarefas (para calendar)
  async getTasks(): Promise<any[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const response = await this.axiosInstance.get('/tasks', {
        params: {
          company_id: user.company_id,
          $limit: 100,
          '$sort[dueDate]': 1,
        },
      });
      return this.normalizeFeathersResponse<any>(response.data);
    } catch (error) {
      console.error('Get tasks error:', error);
      return [];
    }
  }

  // Lembretes (Tasks)
  async getReminders(): Promise<Reminder[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const response = await this.axiosInstance.get('/tasks', {
        params: {
          company_id: user.company_id,
          $limit: 100,
          '$sort[_id]': -1,  // Ordem decrescente
        },
      });
      return this.normalizeFeathersResponse<Reminder>(response.data);
    } catch (error) {
      console.error('Get reminders error:', error);
      return [];
    }
  }

  // Verificar se task tem notificação agendada
  async getSchedulesForTask(taskId: string) {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const response = await this.axiosInstance.get('/schedules', {
        params: {
          company_id: user.company_id,
          related_id: taskId,
          related_model: 'tasks',
          $limit: 10,
        },
      });
      return this.normalizeFeathersResponse(response.data);
    } catch (error) {
      console.error('Get schedules for task error:', error);
      return [];
    }
  }

  async createReminder(reminderData: any) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not found');

      const response = await this.axiosInstance.post('/schedules', {
        ...reminderData,
        company_id: user.company_id,
        user_id: user._id,
      });
      return response.data;
    } catch (error) {
      console.error('Create reminder error:', error);
      throw error;
    }
  }

  async updateReminder(id: string, reminderData: any) {
    try {
      const response = await this.axiosInstance.patch(`/tasks/${id}`, reminderData);
      return response.data;
    } catch (error) {
      console.error('Update reminder error:', error);
      throw error;
    }
  }

  async deleteReminder(id: string) {
    try {
      await this.axiosInstance.delete(`/tasks/${id}`);
    } catch (error) {
      console.error('Delete reminder error:', error);
      throw error;
    }
  }

  async markReminderAsCompleted(id: string) {
    try {
      const response = await this.axiosInstance.patch(`/tasks/${id}`, {
        status: 1,  // 1 = concluído
      });
      return response.data;
    } catch (error) {
      console.error('Mark reminder as completed error:', error);
      throw error;
    }
  }

  async sendReminderToWhatsApp(reminderId: string, phoneNumber: string, message: string) {
    try {
      const response = await this.axiosInstance.post('/sendTaskReminder', {
        reminder_id: reminderId,
        phone: phoneNumber,
        message,
      });
      return response.data;
    } catch (error) {
      console.error('Send reminder to WhatsApp error:', error);
      throw error;
    }
  }

  // Schedules/Notificações (para monitoramento)
  async getSchedules() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const response = await this.axiosInstance.get('/schedules', {
        params: {
          company_id: user.company_id,
          $limit: 200,
          '$sort[scheduled_datetime]': -1,  // Mais recentes primeiro
        },
      });
      return this.normalizeFeathersResponse<any>(response.data);
    } catch (error) {
      console.error('Get schedules error:', error);
      return [];
    }
  }

  async deleteSchedule(scheduleId: string) {
    try {
      await this.axiosInstance.delete(`/schedules/${scheduleId}`);
    } catch (error) {
      console.error('Delete schedule error:', error);
      throw error;
    }
  }

  // Push Notifications
  async updatePushToken(userId: string, pushToken: string) {
    try {
      const response = await this.axiosInstance.patch(`/users/${userId}`, {
        pushToken,
      });
      return response.data;
    } catch (error) {
      console.error('Update push token error:', error);
      throw error;
    }
  }

  // User Profile
  async updateProfile(userId: string, data: any) {
    try {
      const response = await this.axiosInstance.patch(`/users/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // ==================== CHAT / OMNICHANNEL ====================

  // Buscar contatos do omnichannel (conversas recentes)
  async getOmnichannelContacts(options?: {
    platform?: 'whatsapp' | 'instagram' | 'email';
    phoneOrigin?: string;
    withMessages?: boolean;
    populate?: string;
  }) {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      // Construir query parameters
      const params: any = {
        company_id: user.company_id,
        limit: '1000',
      };
      
      // Adicionar platform se fornecido
      // Para WhatsApp, não filtrar por platform específico (pode ser Twilio ou ApiZap)
      if (options?.platform && options.platform !== 'whatsapp') {
        params.platform = options.platform;
      }
      
      // Adicionar phone_origin se fornecido
      if (options?.phoneOrigin) {
        params.phone_origin = options.phoneOrigin;
      }
      
      // Usar rota otimizada que já retorna contatos ordenados
      const response = await this.axiosInstance.get('/contacts-ordered', { params });
      
      // A rota retorna { success: true, data: [...] } ou array direto
      let contacts = [];
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        contacts = Array.isArray(response.data.data) ? response.data.data : [];
      } else {
        contacts = Array.isArray(response.data) ? response.data : [];
      }
      
      // Se solicitou populate, buscar categoria e tags manualmente
      if (options?.populate && contacts.length > 0) {
        const populateFields = options.populate.split(',').map(f => f.trim());
        
        // Buscar categorias se solicitado
        if (populateFields.includes('category_id') || populateFields.includes('category')) {
          const categoryIds = contacts
            .map((c: any) => c.category_id)
            .filter((id: any) => id && typeof id === 'string');
          
          if (categoryIds.length > 0) {
            try {
              const categoriesResponse = await this.axiosInstance.get('/client-categories', {
                params: {
                  _id: { $in: categoryIds },
                  $limit: 1000
                }
              });
              const categories = this.normalizeFeathersResponse(categoriesResponse.data);
              
              // Mapear categorias para os contatos
              contacts = contacts.map((contact: any) => {
                if (contact.category_id) {
                  const category = categories.find((cat: any) => cat._id === contact.category_id);
                  if (category) {
                    return { ...contact, category };
                  }
                }
                return contact;
              });
            } catch (err) {
              console.warn('Erro ao buscar categorias:', err);
            }
          }
        }
        
        // Buscar tags se solicitado
        if (populateFields.includes('tags')) {
          const allTagIds = contacts
            .flatMap((c: any) => c.tags || [])
            .filter((id: any) => id && typeof id === 'string');
          
          if (allTagIds.length > 0) {
            try {
              const tagsResponse = await this.axiosInstance.get('/client-tags', {
                params: {
                  _id: { $in: allTagIds },
                  $limit: 1000
                }
              });
              const tags = this.normalizeFeathersResponse(tagsResponse.data);
              
              // Mapear tags para os contatos
              contacts = contacts.map((contact: any) => {
                if (contact.tags && Array.isArray(contact.tags)) {
                  const populatedTags = contact.tags
                    .map((tagId: any) => tags.find((tag: any) => tag._id === tagId))
                    .filter((tag: any) => tag !== undefined);
                  
                  if (populatedTags.length > 0) {
                    return { ...contact, tags: populatedTags };
                  }
                }
                return contact;
              });
            } catch (err) {
              console.warn('Erro ao buscar tags:', err);
            }
          }
        }
      }
      
      return contacts;
    } catch (error) {
      console.error('Get omnichannel contacts error:', error);
      return [];
    }
  }

  // Buscar todos os clientes (usa mesma rota que getClients)
  async getAllClients(page: number = 1, limit: number = 50) {
    try {
      const user = await this.getCurrentUser();
      if (!user) return { data: [], total: 0, page: 1, totalPages: 1 };

      const response = await this.axiosInstance.get('/client', {
        params: {
          company_id: user.company_id,
          $limit: limit,
          $skip: (page - 1) * limit,
          '$sort[name]': 1,  // Ordem alfabética
        },
      });
      
      // Normalizar resposta Feathers
      const data = this.normalizeFeathersResponse<any>(response.data);
      const total = response.data.total || data.length;
      
      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Get all clients error:', error);
      return { data: [], total: 0, page: 1, totalPages: 1 };
    }
  }

  // Buscar mensagens por client_id
  async getMessagesByClientId(clientId: string, phoneOrigin?: string, limit: number = 500) {
    try {
      const user = await this.getCurrentUser();
      if (!user) return { client: null, messages: [], stats: {} };

      // Construir parâmetros conforme web
      const params: any = {
        client_id: clientId,
        mark_as_read: 'true',  // Marcar como lidas ao abrir
        limit: limit.toString(),
        '$sort[createdAt]': '-1',  // Ordenar por data decrescente
      };
      
      if (phoneOrigin) params.phone_origin = phoneOrigin;

      try {
        const response = await this.axiosInstance.get(
          `/client-messages/${user.company_id}/${user._id}`,
          { params }
        );
        
        // Normalizar resposta (pode vir { success, data } ou direto)
        if (response.data.success && response.data.data) {
          return {
            client: response.data.data.client || null,
            messages: response.data.data.messages || [],
            stats: response.data.data.stats || {},
          };
        } else if (response.data.client && response.data.messages) {
          return {
            client: response.data.client,
            messages: response.data.messages,
            stats: response.data.stats || {},
          };
        }
        
        return { client: null, messages: [], stats: {} };
      } catch (error) {
        // Fallback: buscar direto da collection chat
        console.warn('Rota /client-messages falhou, tentando fallback /chat...', error);
        
        const chatParams: any = {
          client_id: clientId,
          company_id: user.company_id,
          $limit: limit,
          '$sort[createdAt]': -1,
        };
        
        if (phoneOrigin) chatParams.phone_origin = phoneOrigin;
        
        const chatResponse = await this.axiosInstance.get('/chat', { params: chatParams });
        const messages = this.normalizeFeathersResponse<any>(chatResponse.data);
        
        return {
          client: null,
          messages,
          stats: {},
        };
      }
    } catch (error) {
      console.error('Get messages by client ID error:', error);
      throw error;
    }
  }

  // Buscar mensagens por contato (fallback)
  async getMessagesByContact(contactId: string, phoneNumber?: string) {
    try {
      const params: any = {};
      if (phoneNumber) params.phone_number = phoneNumber;

      const response = await this.axiosInstance.get(
        `/omnichannel/messages/${contactId}`,
        { params }
      );
      
      return this.normalizeFeathersResponse<any>(response.data);
    } catch (error) {
      console.error('Get messages by contact error:', error);
      return [];
    }
  }

  // Buscar uma única mensagem por ID
  async getMessageById(messageId: string) {
    try {
      const response = await this.axiosInstance.get(`/chat/${messageId}`);
      return response.data.data || response.data || null;
    } catch (error) {
      console.error('Get message by ID error:', error);
      return null;
    }
  }

  // Buscar configurações de números WhatsApp
  async getPhoneConfigs() {
    try {
      const response = await this.axiosInstance.get('/omnichannel/phone-configs');
      return this.normalizeFeathersResponse(response.data);
    } catch (error) {
      console.error('Get phone configs error:', error);
      throw error;
    }
  }

  // Atualizar dados do cliente
  async updateClient(clientId: string, data: any) {
    try {
      const response = await this.axiosInstance.patch(`/client/${clientId}`, data);
      return response.data;
    } catch (error) {
      console.error('Update client error:', error);
      throw error;
    }
  }

  // Enviar mensagem WhatsApp (texto simples)
  async sendWhatsAppMessage(data: {
    phone: string;
    message: string;
    connectionId: string;
  }) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not found');

      console.log('📤 Enviando mensagem WhatsApp...');
      console.log('   - Phone:', data.phone);
      console.log('   - Connection ID:', data.connectionId);

      // Buscar informações da conexão para saber se é Twilio ou ApiZap
      const connections = await this.axiosInstance.get('/whatsapp-connections', {
        params: {
          _id: data.connectionId,
          company_id: user.company_id,
          $limit: 1
        }
      });

      const connection = connections.data?.data?.[0] || connections.data?.[0];
      const isTwilio = connection?.platform === 'twilio';

      console.log('📱 Tipo de conexão:', isTwilio ? 'Twilio (Oficial)' : 'ApiZap (QR Code)');

      // Buscar client_id baseado no phone
      const clients = await this.axiosInstance.get('/client', {
        params: {
          phone: data.phone,
          company_id: user.company_id,
          $limit: 1
        }
      });

      let client_id = null;
      if (clients.data && clients.data.data && clients.data.data.length > 0) {
        client_id = clients.data.data[0]._id;
        console.log('✅ Client ID encontrado:', client_id);
      } else {
        console.warn('⚠️ Client não encontrado para phone:', data.phone);
      }

      if (!client_id) {
        throw new Error('Client ID não encontrado');
      }

      // Escolher rota baseado no tipo de conexão
      let url: string;
      let payload: any;

      if (isTwilio) {
        // Twilio (WhatsApp Oficial)
        url = `/send-whatsapp-twilio/${user.company_id}/${client_id}/${user._id}`;
        payload = {
          message: data.message
        };
        console.log('📤 Enviando via Twilio (WhatsApp Oficial)');
      } else {
        // ApiZap (WhatsApp QR Code)
        url = `/apizap/send-message/${user.company_id}/${client_id}/${user._id}`;
        payload = {
          message: data.message,
          instanceId: data.connectionId
        };
        console.log('📤 Enviando via ApiZap (QR Code)');
      }

      console.log('   - URL:', url);
      console.log('   - Payload:', payload);

      const response = await this.axiosInstance.post(url, payload);
      
      console.log('✅ Mensagem enviada com sucesso!');
      return response.data;
    } catch (error) {
      console.error('❌ Send WhatsApp message error:', error);
      throw error;
    }
  }

  // Marcar mensagens como lidas
  // ℹ️ NOTA: A marcação como lida é feita automaticamente na busca de mensagens
  // através do parâmetro mark_as_read=true em getMessagesByClientId
  async markMessagesAsRead(clientId: string, phoneOrigin?: string) {
    // Função mantida para compatibilidade, mas não faz nada
    // A marcação já é feita em getMessagesByClientId com mark_as_read=true
    return;
  }
}

export const apiService = new ApiService();
