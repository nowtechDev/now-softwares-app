import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';

interface Schedule {
  _id: string;
  schedule_type: string;
  execution_status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';
  scheduled_datetime: string;
  delivery_methods: string[];
  metadata?: {
    title?: string;
    taskName?: string;
    description?: string;
  };
  delivery_attempts?: Array<{
    method: string;
    status: 'success' | 'failed' | 'pending';
    timestamp: string;
    error_message?: string;
  }>;
  executed_at?: number;
  error_message?: string;
  attempt_count?: number;
  max_attempts?: number;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationsStatusScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'failed'>('all');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getSchedules();
      // Ordenar por data de agendamento (mais recentes primeiro)
      const sorted = data.sort((a: Schedule, b: Schedule) => 
        new Date(b.scheduled_datetime).getTime() - new Date(a.scheduled_datetime).getTime()
      );
      setSchedules(sorted);
    } catch (error) {
      console.error('Error loading schedules:', error);
      Alert.alert('Erro', 'Não foi possível carregar as notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadSchedules();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3b82f6'; // Azul
      case 'processing': return '#f59e0b'; // Laranja
      case 'completed': return '#10b981'; // Verde
      case 'failed': return '#ef4444'; // Vermelho
      case 'cancelled': return '#6b7280'; // Cinza
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return 'time-outline';
      case 'processing': return 'hourglass-outline';
      case 'completed': return 'checkmark-circle';
      case 'failed': return 'close-circle';
      case 'cancelled': return 'ban-outline';
      default: return 'help-circle-outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendada';
      case 'processing': return 'Processando';
      case 'completed': return 'Enviada';
      case 'failed': return 'Falhou';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntil = (dateStr: string) => {
    const scheduledDate = new Date(dateStr);
    const now = new Date();
    const diffMs = scheduledDate.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Passou';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `Em ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Em ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Em ${diffDays} dias`;
  };

  const filteredSchedules = schedules.filter(s => {
    if (filter === 'all') return true;
    return s.execution_status === filter;
  });

  const stats = {
    scheduled: schedules.filter(s => s.execution_status === 'scheduled').length,
    completed: schedules.filter(s => s.execution_status === 'completed').length,
    failed: schedules.filter(s => s.execution_status === 'failed').length,
  };

  return (
    <View style={styles.container}>
      {/* Header com Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{stats.scheduled}</Text>
          <Text style={styles.statLabel}>Agendadas</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Enviadas</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="close-circle" size={24} color="#ef4444" />
          <Text style={styles.statValue}>{stats.failed}</Text>
          <Text style={styles.statLabel}>Falhas</Text>
        </View>
      </View>

      {/* Filtros */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Todas ({schedules.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filter === 'scheduled' && styles.filterButtonActive]}
          onPress={() => setFilter('scheduled')}
        >
          <Text style={[styles.filterText, filter === 'scheduled' && styles.filterTextActive]}>
            Agendadas ({stats.scheduled})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Enviadas ({stats.completed})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filter === 'failed' && styles.filterButtonActive]}
          onPress={() => setFilter('failed')}
        >
          <Text style={[styles.filterText, filter === 'failed' && styles.filterTextActive]}>
            Falhas ({stats.failed})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Lista de Schedules */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        nestedScrollEnabled={true}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        ) : filteredSchedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={80} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
            <Text style={styles.emptyDescription}>
              {filter === 'all' 
                ? 'Não há notificações agendadas' 
                : `Não há notificações ${getStatusLabel(filter).toLowerCase()}`}
            </Text>
          </View>
        ) : (
          filteredSchedules.map((schedule) => (
            <TouchableOpacity
              key={schedule._id}
              style={styles.scheduleCard}
              onPress={() => {
                Alert.alert(
                  'Detalhes da Notificação',
                  `Status: ${getStatusLabel(schedule.execution_status)}\n` +
                  `Agendada para: ${formatDateTime(schedule.scheduled_datetime)}\n` +
                  `Métodos: ${schedule.delivery_methods.join(', ')}\n` +
                  `Tentativas: ${schedule.attempt_count || 0}/${schedule.max_attempts || 3}\n` +
                  (schedule.error_message ? `\nErro: ${schedule.error_message}` : ''),
                  [{ text: 'OK' }]
                );
              }}
            >
              {/* Header do Card */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.execution_status) }]}>
                    <Ionicons 
                      name={getStatusIcon(schedule.execution_status) as any} 
                      size={16} 
                      color="#fff" 
                    />
                    <Text style={styles.statusText}>
                      {getStatusLabel(schedule.execution_status)}
                    </Text>
                  </View>
                  
                  {schedule.execution_status === 'scheduled' && (
                    <Text style={styles.timeUntil}>
                      {getTimeUntil(schedule.scheduled_datetime)}
                    </Text>
                  )}
                </View>
                
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>

              {/* Título */}
              <Text style={styles.scheduleTitle}>
                {schedule.metadata?.title || schedule.metadata?.taskName || 'Sem título'}
              </Text>

              {/* Descrição */}
              {schedule.metadata?.description && (
                <Text style={styles.scheduleDescription} numberOfLines={2}>
                  {schedule.metadata.description}
                </Text>
              )}

              {/* Informações */}
              <View style={styles.scheduleInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                  <Text style={styles.infoText}>
                    {formatDateTime(schedule.scheduled_datetime)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  {schedule.delivery_methods.map((method, idx) => (
                    <View key={idx} style={styles.methodBadge}>
                      <Ionicons 
                        name={
                          method === 'push' ? 'notifications' :
                          method === 'email' ? 'mail' :
                          method === 'whatsapp' ? 'logo-whatsapp' :
                          'send'
                        } 
                        size={12} 
                        color="#6366f1" 
                      />
                      <Text style={styles.methodText}>{method}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Tentativas de Entrega */}
              {schedule.delivery_attempts && schedule.delivery_attempts.length > 0 && (
                <View style={styles.attemptsContainer}>
                  <Text style={styles.attemptsTitle}>Tentativas:</Text>
                  {schedule.delivery_attempts.slice(-3).map((attempt, idx) => (
                    <View key={idx} style={styles.attemptRow}>
                      <Ionicons 
                        name={attempt.status === 'success' ? 'checkmark-circle' : 'close-circle'} 
                        size={14} 
                        color={attempt.status === 'success' ? '#10b981' : '#ef4444'} 
                      />
                      <Text style={styles.attemptText}>
                        {attempt.method} - {attempt.status === 'success' ? 'Sucesso' : 'Falhou'}
                      </Text>
                      {attempt.error_message && (
                        <Text style={styles.attemptError} numberOfLines={1}>
                          {attempt.error_message}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Erro */}
              {schedule.error_message && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#ef4444" />
                  <Text style={styles.errorText} numberOfLines={2}>
                    {schedule.error_message}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 8,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  filterContainer: {
    backgroundColor: '#fff',
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1, // Ocupa espaço disponível
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 20,
    flexGrow: 1, // Cresce conforme necessário
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  timeUntil: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  scheduleInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 4,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
  },
  attemptsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  attemptsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  attemptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  attemptText: {
    fontSize: 12,
    color: '#6b7280',
  },
  attemptError: {
    fontSize: 11,
    color: '#ef4444',
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    flex: 1,
  },
});
