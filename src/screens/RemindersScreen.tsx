import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService, Reminder } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import NotificationsStatusScreen from './NotificationsStatusScreen';
// Notificações serão gerenciadas pelo backend via schedules

export default function RemindersScreen({ navigation }: any) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [whatsappModalVisible, setWhatsappModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form states
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDescription, setReminderDescription] = useState('');
  const [reminderDate, setReminderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [sendPush, setSendPush] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [taskSchedules, setTaskSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getReminders();
      setReminders(data);
    } catch (error) {
      console.error('Error loading reminders:', error);
      Alert.alert('Erro', 'Não foi possível carregar os lembretes');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadReminders();
    setIsRefreshing(false);
  };

  const groupRemindersByDate = () => {
    const groups: { [key: string]: Reminder[] } = {};
    
    reminders.forEach((reminder) => {
      if (!reminder.date) return; // Pular tasks sem data
      const date = parseTaskDate(reminder.date);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(reminder);
    });

    return groups;
  };

  const handleCreateReminder = async () => {
    if (!reminderTitle.trim()) {
      Alert.alert('Atenção', 'Preencha o título do lembrete');
      return;
    }

    try {
      const deliveryMethods = [];
      if (sendPush) deliveryMethods.push('push');
      if (sendEmail) deliveryMethods.push('email');
      if (sendWhatsApp) deliveryMethods.push('whatsapp');

      // Converter data para formato YYYYMMDD
      const year = reminderDate.getFullYear();
      const month = String(reminderDate.getMonth() + 1).padStart(2, '0');
      const day = String(reminderDate.getDate()).padStart(2, '0');
      const dateNum = parseInt(`${year}${month}${day}`);

      // Converter hora para decimal (ex: 14:30 = 14.5)
      const hours = reminderDate.getHours();
      const minutes = reminderDate.getMinutes();
      const hourDecimal = hours + (minutes / 60);

      console.log('📅 Agendamento:', {
        titulo: reminderTitle,
        dataHora: reminderDate.toLocaleString('pt-BR'),
        date: dateNum,
        hour: hourDecimal,
        metodos: deliveryMethods,
        taskId: selectedReminder?._id,
      });

      const reminderData = {
        date: dateNum,
        hour: hourDecimal,
        schedule_type: 'task_reminder',
        delivery_methods: deliveryMethods,
        execution_status: 'scheduled',
        status: 1,
        related_model: selectedReminder ? 'tasks' : undefined,
        related_id: selectedReminder?._id,
        metadata: {
          taskName: reminderTitle,
          title: reminderTitle,
          taskDescription: reminderDescription,
          description: reminderDescription,
          reminderMessage: `${reminderTitle}\n${reminderDescription}`,
        },
      };

      await apiService.createReminder(reminderData);
      
      if (selectedReminder) {
        Alert.alert('Sucesso', 'Notificação agendada com sucesso!\n\nVocê pode ver o status na lista de agendamentos.');
        await loadTaskSchedules(selectedReminder._id);
        setDetailsModalVisible(true);
      } else {
        Alert.alert('Sucesso', 'Lembrete criado com sucesso!');
        loadReminders();
      }
      
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error creating reminder:', error);
      Alert.alert('Erro', 'Não foi possível criar o agendamento');
    }
  };

  const handleToggleStatus = async (reminder: Reminder) => {
    try {
      const newStatus = reminder.status === 1 ? 0 : 1;
      
      // Atualização otimista (optimistic update) - atualiza UI imediatamente
      setReminders(prevReminders =>
        prevReminders.map(r =>
          r._id === reminder._id ? { ...r, status: newStatus } : r
        )
      );
      
      // Atualiza no servidor em background
      await apiService.updateReminder(reminder._id, { 
        status: newStatus
      });
    } catch (error) {
      console.error('Error toggling status:', error);
      // Se falhar, reverte a mudança
      setReminders(prevReminders =>
        prevReminders.map(r =>
          r._id === reminder._id ? { ...r, status: reminder.status } : r
        )
      );
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };

  const handleMarkAsCompleted = async (reminder: Reminder) => {
    await handleToggleStatus(reminder);
  };

  const handleDeleteReminder = async (reminder: Reminder) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja realmente excluir este lembrete?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove da UI imediatamente
              setReminders(prevReminders =>
                prevReminders.filter(r => r._id !== reminder._id)
              );
              
              // Deleta no servidor em background
              await apiService.deleteReminder(reminder._id);
              Alert.alert('Sucesso', 'Lembrete excluído!');
            } catch (error) {
              console.error('Error deleting reminder:', error);
              // Se falhar, recarrega para restaurar
              await loadReminders();
              Alert.alert('Erro', 'Não foi possível excluir o lembrete');
            }
          },
        },
      ]
    );
  };

  const handleSendToWhatsApp = async () => {
    if (!whatsappPhone.trim() || !whatsappMessage.trim()) {
      Alert.alert('Atenção', 'Preencha o telefone e a mensagem');
      return;
    }

    try {
      await apiService.sendReminderToWhatsApp(
        selectedReminder!._id,
        whatsappPhone,
        whatsappMessage
      );
      Alert.alert('Sucesso', 'Lembrete enviado por WhatsApp!');
      setWhatsappModalVisible(false);
      resetWhatsAppForm();
    } catch (error) {
      console.error('Error sending to WhatsApp:', error);
      Alert.alert('Erro', 'Não foi possível enviar o lembrete');
    }
  };

  const loadTaskSchedules = async (taskId: string) => {
    try {
      setLoadingSchedules(true);
      const schedules = await apiService.getSchedulesForTask(taskId);
      setTaskSchedules(schedules);
    } catch (error) {
      console.error('Error loading task schedules:', error);
      setTaskSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    Alert.alert(
      'Excluir Agendamento',
      'Deseja excluir esta notificação agendada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteSchedule(scheduleId);
              Alert.alert('Sucesso', 'Agendamento excluído!');
              if (selectedReminder) {
                await loadTaskSchedules(selectedReminder._id);
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o agendamento');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setReminderTitle('');
    setReminderDescription('');
    setReminderDate(new Date());
    setShowDatePicker(false);
    setShowTimePicker(false);
    setSelectedReminder(null);
    setIsEditMode(false);
    setTaskSchedules([]);
    // Push marcado por padrão APENAS para NOVOS lembretes
    setSendPush(true);
    setSendEmail(false);
    setSendWhatsApp(false);
  };

  const resetWhatsAppForm = () => {
    setWhatsappPhone('');
    setWhatsappMessage('');
    setSelectedReminder(null);
  };

  const openWhatsAppModal = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setWhatsappMessage(reminder.name || '');
    setWhatsappModalVisible(true);
  };

  const parseTaskDate = (dateNum: number | null | undefined) => {
    if (!dateNum) return new Date();
    const dateStr = dateNum.toString();
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  };

  const formatTime = (reminder: Reminder) => {
    if (reminder.hour && reminder.minutes) {
      return `${reminder.hour}:${reminder.minutes}`;
    }
    return '';
  };

  const formatDate = (dateNum: number | null | undefined) => {
    if (!dateNum) return 'Sem data';
    const date = parseTaskDate(dateNum);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isToday = (dateNum: number | null | undefined) => {
    if (!dateNum) return false;
    const date = parseTaskDate(dateNum);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (dateNum: number | null | undefined) => {
    if (!dateNum) return false;
    const date = parseTaskDate(dateNum);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const getDateLabel = (dateKey: string, dateNum: number | null | undefined) => {
    if (!dateNum) return 'Sem data';
    if (isToday(dateNum)) return 'Hoje';
    if (isTomorrow(dateNum)) return 'Amanhã';
    return formatDate(dateNum);
  };

  const groupedReminders = groupRemindersByDate();
  const sortedDates = Object.keys(groupedReminders).sort((a, b) => {
    const dateA = groupedReminders[a][0].date;
    const dateB = groupedReminders[b][0].date;
    return dateB - dateA;  // Decrescente: mais recente primeiro
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header com botão de Voltar e Status */}
      <View style={styles.headerBar}>
        {navigation ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.headerTitle}>Meus Lembretes</Text>
        <TouchableOpacity 
          style={styles.statusButton}
          onPress={() => setStatusModalVisible(true)}
        >
          <Ionicons name="pulse-outline" size={20} color="#6366f1" />
          <Text style={styles.statusButtonText}>Status</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando lembretes...</Text>
          </View>
        ) : reminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={80} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Nenhum lembrete</Text>
            <Text style={styles.emptyDescription}>
              Crie seu primeiro lembrete para não esquecer tarefas importantes
            </Text>
          </View>
        ) : (
          sortedDates.map((dateKey) => {
            const dateReminders = groupedReminders[dateKey];
            const firstReminder = dateReminders[0];
            
            return (
              <View key={dateKey} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>
                  {getDateLabel(dateKey, firstReminder.date)}
                </Text>
                
                {dateReminders.map((reminder) => {
                  const isCompleted = reminder.status === 1;
                  const taskDate = reminder.date ? parseTaskDate(reminder.date) : new Date();
                  const isOverdue = !isCompleted && taskDate < new Date();
                  return (
                  <View
                    key={reminder._id}
                    style={[
                      styles.reminderCard,
                      isCompleted && styles.completedCard,
                      isOverdue && styles.overdueCard,
                    ]}
                  >
                    <View style={styles.cardInner}>
                      {/* Botão Check Grande */}
                      <TouchableOpacity
                        onPress={() => handleToggleStatus(reminder)}
                        style={[
                          styles.checkButton,
                          isCompleted && styles.checkButtonCompleted,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                          size={32} 
                          color={isCompleted ? "#10b981" : (isOverdue ? "#ef4444" : "#9ca3af")} 
                        />
                      </TouchableOpacity>

                      {/* Conteúdo Central */}
                      <TouchableOpacity 
                        style={styles.cardContent}
                        onPress={async () => {
                          setSelectedReminder(reminder);
                          await loadTaskSchedules(reminder._id);
                          setDetailsModalVisible(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.cardHeader}>
                          <Text style={styles.reminderTitle}>
                            {reminder.name || 'Sem título'}
                          </Text>
                          {isCompleted && (
                            <View style={styles.completedBadge}>
                              <Text style={styles.completedText}>Concluído</Text>
                            </View>
                          )}
                        </View>
                        
                        {(reminder.description || reminder.preview) && (
                          <Text style={styles.reminderDescription} numberOfLines={2}>
                            {reminder.description || reminder.preview}
                          </Text>
                        )}
                        
                        <View style={styles.cardFooter}>
                          <View style={styles.timeContainer}>
                            <Ionicons name="calendar-outline" size={14} color="#6366f1" />
                            <Text style={styles.timeText}>
                              {formatDate(reminder.date)}
                              {formatTime(reminder) && ` às ${formatTime(reminder)}`}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* Ações Rápidas */}
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={async () => {
                            setSelectedReminder(reminder);
                            setIsEditMode(true);
                            setReminderTitle(reminder.name || '');
                            setReminderDescription(reminder.description || reminder.preview || '');
                            const taskDate = reminder.date ? parseTaskDate(reminder.date) : new Date();
                            setReminderDate(taskDate);
                            
                            // Verificar se tem schedules agendados
                            try {
                              const schedules = await apiService.getSchedulesForTask(reminder._id);
                              if (schedules && schedules.length > 0) {
                                const schedule = schedules[0] as any;
                                const deliveryMethods = schedule.delivery_methods || [];
                                setSendPush(deliveryMethods.includes('push'));
                                setSendEmail(deliveryMethods.includes('email'));
                                setSendWhatsApp(deliveryMethods.includes('whatsapp'));
                              } else {
                                // Sem schedules, desmarcar tudo
                                setSendPush(false);
                                setSendEmail(false);
                                setSendWhatsApp(false);
                              }
                            } catch (error) {
                              console.log('Sem schedules para esta task');
                              setSendPush(false);
                              setSendEmail(false);
                              setSendWhatsApp(false);
                            }
                            
                            setModalVisible(true);
                          }}
                          style={styles.actionIconButton}
                        >
                          <Ionicons name="create-outline" size={20} color="#6366f1" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => handleDeleteReminder(reminder)}
                          style={styles.actionIconButton}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )})}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Botão Flutuante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal Criar Lembrete */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Lembrete</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                value={reminderTitle}
                onChangeText={setReminderTitle}
                placeholder="Ex: Reunião com cliente"
              />

              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reminderDescription}
                onChangeText={setReminderDescription}
                placeholder="Detalhes adicionais..."
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Data e Hora</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={styles.dateButtonHalf}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6366f1" />
                  <Text style={styles.dateButtonText}>
                    {reminderDate.toLocaleDateString('pt-BR')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateButtonHalf}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#6366f1" />
                  <Text style={styles.dateButtonText}>
                    {reminderDate.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={reminderDate}
                  mode="date"
                  display="default"
                  onChange={(_event: any, selectedDate?: Date) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setReminderDate(selectedDate);
                    }
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={reminderDate}
                  mode="time"
                  display="default"
                  onChange={(_event: any, selectedTime?: Date) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      setReminderDate(selectedTime);
                    }
                  }}
                />
              )}

              <Text style={styles.label}>Métodos de Entrega</Text>
              
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="notifications-outline" size={20} color="#6366f1" />
                  <Text style={styles.switchLabel}>Notificação Push</Text>
                </View>
                <Switch
                  value={sendPush}
                  onValueChange={setSendPush}
                  trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                  thumbColor={sendPush ? '#6366f1' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="mail-outline" size={20} color="#6b7280" />
                  <Text style={styles.switchLabel}>Email</Text>
                </View>
                <Switch
                  value={sendEmail}
                  onValueChange={setSendEmail}
                  trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                  thumbColor={sendEmail ? '#6366f1' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="logo-whatsapp" size={20} color="#25d366" />
                  <Text style={styles.switchLabel}>WhatsApp</Text>
                </View>
                <Switch
                  value={sendWhatsApp}
                  onValueChange={setSendWhatsApp}
                  trackColor={{ false: '#d1d5db', true: '#86efac' }}
                  thumbColor={sendWhatsApp ? '#25d366' : '#f4f3f4'}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleCreateReminder}
              >
                <Text style={styles.createButtonText}>Criar Lembrete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal WhatsApp */}
      <Modal
        visible={whatsappModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWhatsappModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enviar por WhatsApp</Text>
              <TouchableOpacity onPress={() => setWhatsappModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.label}>Número de Telefone *</Text>
              <TextInput
                style={styles.input}
                value={whatsappPhone}
                onChangeText={setWhatsappPhone}
                placeholder="Ex: 5511999999999"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Mensagem *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={whatsappMessage}
                onChangeText={setWhatsappMessage}
                placeholder="Digite a mensagem..."
                multiline
                numberOfLines={6}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setWhatsappModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.whatsappButton]}
                onPress={handleSendToWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={styles.whatsappButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Detalhes */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.modalOverlay}
          onPress={() => setDetailsModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes do Lembrete</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedReminder && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Título</Text>
                    <Text style={styles.detailValue}>
                      {selectedReminder.name || 'Sem título'}
                    </Text>
                  </View>

                  {(selectedReminder.description || selectedReminder.preview) && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Descrição</Text>
                      <Text style={styles.detailValue}>
                        {selectedReminder.description || selectedReminder.preview}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Data e Hora</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedReminder.date)}
                      {formatTime(selectedReminder) && ` às ${formatTime(selectedReminder)}`}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[
                      styles.statusBadge,
                      selectedReminder.status === 1 ? styles.statusBadgeCompleted : null,
                      (selectedReminder.status !== 1 && selectedReminder.date && parseTaskDate(selectedReminder.date) < new Date()) ? styles.statusBadgeOverdue : null
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        {selectedReminder.status === 1
                          ? 'Concluído' 
                          : (selectedReminder.date && parseTaskDate(selectedReminder.date) < new Date() ? 'Atrasado' : 'Pendente')}
                      </Text>
                    </View>
                  </View>

                  {/* Notificações Agendadas */}
                  <View style={styles.schedulesSection}>
                    <View style={styles.schedulesSectionHeader}>
                      <Text style={styles.detailLabel}>Notificações Agendadas</Text>
                      {loadingSchedules ? (
                        <Text style={styles.loadingSmall}>Carregando...</Text>
                      ) : (
                        <TouchableOpacity
                          style={styles.addScheduleButton}
                          onPress={() => {
                            setDetailsModalVisible(false);
                            setReminderTitle(selectedReminder.name || '');
                            setReminderDescription(selectedReminder.description || selectedReminder.preview || '');
                            const taskDate = selectedReminder.date ? parseTaskDate(selectedReminder.date) : new Date();
                            setReminderDate(taskDate);
                            setSendPush(true);
                            setSendEmail(false);
                            setSendWhatsApp(false);
                            setModalVisible(true);
                          }}
                        >
                          <Ionicons name="add-circle-outline" size={16} color="#6366f1" />
                          <Text style={styles.addScheduleButtonText}>Adicionar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {taskSchedules.length === 0 ? (
                      <Text style={styles.noSchedulesText}>
                        Nenhuma notificação agendada para esta tarefa
                      </Text>
                    ) : (
                      taskSchedules.map((schedule: any, idx: number) => (
                        <View key={schedule._id || idx} style={styles.scheduleItem}>
                          <View style={styles.scheduleItemHeader}>
                            <View style={[
                              styles.scheduleStatusDot,
                              { backgroundColor: 
                                schedule.execution_status === 'scheduled' ? '#3b82f6' :
                                schedule.execution_status === 'completed' ? '#10b981' :
                                schedule.execution_status === 'failed' ? '#ef4444' : '#6b7280'
                              }
                            ]} />
                            <Text style={styles.scheduleStatusText}>
                              {schedule.execution_status === 'scheduled' ? 'Agendada' :
                               schedule.execution_status === 'completed' ? 'Enviada' :
                               schedule.execution_status === 'failed' ? 'Falhou' : schedule.execution_status}
                            </Text>
                          </View>
                          
                          <Text style={styles.scheduleDateTime}>
                            {new Date(schedule.scheduled_datetime).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                          
                          <View style={styles.scheduleMethodsRow}>
                            {schedule.delivery_methods?.map((method: string, midx: number) => (
                              <View key={midx} style={styles.scheduleMethodBadge}>
                                <Ionicons 
                                  name={
                                    method === 'push' ? 'notifications' :
                                    method === 'email' ? 'mail' :
                                    method === 'whatsapp' ? 'logo-whatsapp' : 'send'
                                  } 
                                  size={10} 
                                  color="#6366f1" 
                                />
                                <Text style={styles.scheduleMethodText}>{method}</Text>
                              </View>
                            ))}
                          </View>

                          {schedule.error_message && (
                            <Text style={styles.scheduleError} numberOfLines={2}>
                              ⚠️ {schedule.error_message}
                            </Text>
                          )}

                          {schedule.execution_status === 'scheduled' && (
                            <TouchableOpacity
                              style={styles.deleteScheduleButton}
                              onPress={() => handleDeleteSchedule(schedule._id)}
                            >
                              <Ionicons name="trash-outline" size={14} color="#ef4444" />
                              <Text style={styles.deleteScheduleText}>Excluir agendamento</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Fechar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={async () => {
                  if (selectedReminder) {
                    setIsEditMode(true);
                    setReminderTitle(selectedReminder.name || '');
                    setReminderDescription(selectedReminder.description || selectedReminder.preview || '');
                    const taskDate = selectedReminder.date ? parseTaskDate(selectedReminder.date) : new Date();
                    setReminderDate(taskDate);
                    
                    // Verificar se tem schedules agendados
                    try {
                      const schedules = await apiService.getSchedulesForTask(selectedReminder._id);
                      if (schedules && schedules.length > 0) {
                        const schedule = schedules[0] as any;
                        const deliveryMethods = schedule.delivery_methods || [];
                        setSendPush(deliveryMethods.includes('push'));
                        setSendEmail(deliveryMethods.includes('email'));
                        setSendWhatsApp(deliveryMethods.includes('whatsapp'));
                      } else {
                        setSendPush(false);
                        setSendEmail(false);
                        setSendWhatsApp(false);
                      }
                    } catch (error) {
                      console.log('Sem schedules para esta task');
                      setSendPush(false);
                      setSendEmail(false);
                      setSendWhatsApp(false);
                    }
                    
                    setDetailsModalVisible(false);
                    setModalVisible(true);
                  }
                }}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Editar</Text>
              </TouchableOpacity>
            </View>
          </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal Status das Notificações */}
      <Modal
        visible={statusModalVisible}
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
        statusBarTranslucent={false}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <SafeAreaView style={styles.fullScreenModal} edges={['top', 'bottom']}>
          <View style={styles.fullScreenHeader}>
            <Text style={styles.fullScreenTitle}>Status das Notificações</Text>
            <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
              <Ionicons name="close" size={28} color="#1f2937" />
            </TouchableOpacity>
          </View>
          <NotificationsStatusScreen />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  fullScreenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
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
    lineHeight: 20,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    paddingLeft: 4,
  },
  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  completedCard: {
    opacity: 0.6,
    borderLeftColor: '#10b981',
  },
  overdueCard: {
    borderLeftColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  reminderFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  methodText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalScroll: {
    padding: 20,
    maxHeight: 400,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButtonHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: '#374151',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  createButton: {
    backgroundColor: '#6366f1',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  whatsappButton: {
    backgroundColor: '#25d366',
    flexDirection: 'row',
    gap: 8,
  },
  whatsappButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Novos estilos para layout melhorado
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkButton: {
    padding: 4,
    marginTop: 4,
  },
  checkButtonCompleted: {
    transform: [{ scale: 1.1 }],
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  methodsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  actionIconButton: {
    padding: 6,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  // Estilos do modal de detalhes
  detailRow: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusBadgeOverdue: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  methodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // Estilos para schedules section
  schedulesSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  schedulesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addScheduleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  loadingSmall: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  noSchedulesText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  scheduleItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  scheduleItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scheduleStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scheduleStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  scheduleDateTime: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  scheduleMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  scheduleMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scheduleMethodText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
  },
  scheduleError: {
    fontSize: 12,
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 6,
  },
  deleteScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    marginTop: 6,
  },
  deleteScheduleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
});
