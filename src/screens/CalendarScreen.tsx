import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CalendarEvent {
  _id: string; title: string; description?: string;
  startDateTime: string; endDateTime?: string;
  location?: string;
}

interface Task {
  _id: string; title: string; description?: string;
  dueDate: string; priority?: 'low' | 'medium' | 'high';
}

export default function CalendarScreen({ navigation }: any) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date()); // Começa no dia atual
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStartDate, setEventStartDate] = useState(new Date());
  const [eventEndDate, setEventEndDate] = useState(new Date());

  useEffect(() => { loadData(); }, [currentDate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const [eventsData, tasksData] = await Promise.all([
        apiService.getCalendarEvents(startOfMonth, endOfMonth),
        apiService.getTasks(),
      ]);
      setEvents(eventsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= lastDay; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => new Date(e.startDateTime).toISOString().split('T')[0] === dateStr);
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.dueDate && new Date(t.dueDate).toISOString().split('T')[0] === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  
  const isSameDate = (date1: Date, date2: Date) => date1.toDateString() === date2.toDateString();

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      Alert.alert('Atenção', 'Preencha o título');
      return;
    }
    try {
      await apiService.createCalendarEvent({
        title: eventTitle,
        description: eventDescription,
        location: eventLocation,
        startDateTime: eventStartDate.toISOString(),
        endDateTime: eventEndDate.toISOString(),
        type: 'meeting',
      });
      Alert.alert('Sucesso', 'Evento criado!');
      setCreateModalVisible(false);
      setEventTitle('');
      setEventDescription('');
      setEventLocation('');
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o evento');
    }
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const days = getDaysInMonth();
  const selectedDayEvents = getEventsForDate(selectedDate);
  const selectedDayTasks = getTasksForDate(selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <View style={styles.headerContent}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>
        </View>
        <TouchableOpacity 
          onPress={() => {
            const today = new Date();
            setCurrentDate(today);
            setSelectedDate(today);
          }} 
          style={styles.todayButton}
        >
          <Text style={styles.todayButtonText}>Hoje</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Days Scroll */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.daysScroll}
        contentContainerStyle={styles.daysScrollContent}
      >
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const dayTasks = getTasksForDate(day);
          const hasItems = dayEvents.length > 0 || dayTasks.length > 0;
          const isSelected = isSameDate(day, selectedDate);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayItem,
                isToday(day) && styles.todayDayItem,
                isSelected && styles.selectedDayItem,
              ]}
              onPress={() => setSelectedDate(day)}
            >
              <Text style={[
                styles.dayItemName,
                isSelected && styles.selectedDayItemText,
              ]}>
                {dayNames[day.getDay()]}
              </Text>
              <View style={[
                styles.dayItemNumber,
                isToday(day) && styles.todayDayItemNumber,
                isSelected && styles.selectedDayItemNumber,
              ]}>
                <Text style={[
                  styles.dayItemNumberText,
                  isToday(day) && styles.todayDayItemNumberText,
                  isSelected && styles.selectedDayItemNumberText,
                ]}>
                  {day.getDate()}
                </Text>
              </View>
              {hasItems && !isSelected && (
                <View style={styles.dayDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Events List for Selected Day */}
      <ScrollView
        style={styles.eventsScrollView}
        contentContainerStyle={styles.eventsScrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        ) : (
          <>
            <View style={styles.selectedDateHeader}>
              <Text style={styles.selectedDateTitle}>
                {selectedDate.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </Text>
              <Text style={styles.selectedDateCount}>
                {selectedDayEvents.length + selectedDayTasks.length} {selectedDayEvents.length + selectedDayTasks.length === 1 ? 'compromisso' : 'compromissos'}
              </Text>
            </View>

            {selectedDayEvents.length === 0 && selectedDayTasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={80} color="#d1d5db" />
                <Text style={styles.emptyText}>Nenhum compromisso para este dia</Text>
              </View>
            ) : (
              <>
                {selectedDayEvents.map((event) => (
                  <View key={event._id} style={styles.eventCard}>
                    <View style={styles.eventCardLeft}>
                      <Text style={styles.eventCardTime}>
                        {formatTime(event.startDateTime)}
                      </Text>
                      {event.endDateTime && (
                        <Text style={styles.eventCardEndTime}>
                          {formatTime(event.endDateTime)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.eventCardRight}>
                      <View style={styles.eventCardHeader}>
                        <Ionicons name="calendar" size={18} color="#6366f1" />
                        <Text style={styles.eventCardTitle}>{event.title}</Text>
                      </View>
                      {event.description && (
                        <Text style={styles.eventCardDescription}>{event.description}</Text>
                      )}
                      {event.location && (
                        <View style={styles.eventCardLocation}>
                          <Ionicons name="location-outline" size={14} color="#6b7280" />
                          <Text style={styles.eventCardLocationText}>{event.location}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}

                {selectedDayTasks.map((task) => (
                  <View key={task._id} style={styles.taskCard}>
                    <View style={styles.taskCardLeft}>
                      <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />
                    </View>
                    <View style={styles.taskCardRight}>
                      <View style={styles.taskCardHeader}>
                        <Ionicons name="checkbox-outline" size={18} color={getPriorityColor(task.priority)} />
                        <Text style={styles.taskCardTitle}>{task.title}</Text>
                      </View>
                      {task.description && (
                        <Text style={styles.taskCardDescription}>{task.description}</Text>
                      )}
                      <View style={styles.taskPriorityBadge}>
                        <Text style={[styles.taskPriorityText, { color: getPriorityColor(task.priority) }]}>
                          {task.priority === 'high' ? 'Alta Prioridade' : task.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setCreateModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent onRequestClose={() => setCreateModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Evento</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.label}>Título *</Text>
              <TextInput style={styles.input} value={eventTitle} onChangeText={setEventTitle} placeholder="Ex: Reunião" />
              <Text style={styles.label}>Descrição</Text>
              <TextInput style={[styles.input, styles.textArea]} value={eventDescription} onChangeText={setEventDescription} multiline numberOfLines={3} />
              <Text style={styles.label}>Local</Text>
              <TextInput style={styles.input} value={eventLocation} onChangeText={setEventLocation} />
              <Text style={styles.label}>Data/Hora</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity style={styles.dateButtonHalf} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={20} color="#6366f1" />
                  <Text>{eventStartDate.toLocaleDateString('pt-BR')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButtonHalf} onPress={() => setShowTimePicker(true)}>
                  <Ionicons name="time-outline" size={20} color="#6366f1" />
                  <Text>{eventStartDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={eventStartDate}
                  mode="date"
                  onChange={(_: any, date?: Date) => {
                    setShowDatePicker(false);
                    if (date) {
                      const newDate = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                        eventStartDate.getHours(),
                        eventStartDate.getMinutes()
                      );
                      setEventStartDate(newDate);
                      setEventEndDate(new Date(newDate.getTime() + 3600000));
                    }
                  }}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={eventStartDate}
                  mode="time"
                  onChange={(_: any, time?: Date) => {
                    setShowTimePicker(false);
                    if (time) {
                      const newDate = new Date(
                        eventStartDate.getFullYear(),
                        eventStartDate.getMonth(),
                        eventStartDate.getDate(),
                        time.getHours(),
                        time.getMinutes()
                      );
                      setEventStartDate(newDate);
                      setEventEndDate(new Date(newDate.getTime() + 3600000));
                    }
                  }}
                />
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.createButton]} onPress={handleCreateEvent}>
                <Text style={styles.createButtonText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { padding: 8, marginRight: 8 },
  headerContent: { flex: 1 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navButton: { padding: 4 },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  todayButton: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  todayButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  // Horizontal days scroll
  daysScroll: { 
    backgroundColor: '#fff', 
    maxHeight: 90,  // Altura máxima fixa
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb' 
  },
  daysScrollContent: { 
    paddingHorizontal: 8, 
    paddingVertical: 8, 
    gap: 4,
    alignItems: 'center',  // Centraliza verticalmente
  },
  dayItem: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 50 },
  todayDayItem: { backgroundColor: '#eef2ff' },
  selectedDayItem: { backgroundColor: '#6366f1' },
  dayItemName: { fontSize: 10, color: '#6b7280', marginBottom: 2, fontWeight: '500' },
  selectedDayItemText: { color: '#fff' },
  dayItemNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  todayDayItemNumber: { backgroundColor: '#dbeafe', borderWidth: 1.5, borderColor: '#6366f1' },
  selectedDayItemNumber: { backgroundColor: '#fff' },
  dayItemNumberText: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  todayDayItemNumberText: { color: '#6366f1' },
  selectedDayItemNumberText: { color: '#6366f1' },
  dayDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#6366f1', marginTop: 1 },
  
  // Events list
  eventsScrollView: { flex: 1 },
  eventsScrollContent: { padding: 16, paddingBottom: 80 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6b7280' },
  selectedDateHeader: { marginBottom: 16 },
  selectedDateTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 4, textTransform: 'capitalize' },
  selectedDateCount: { fontSize: 14, color: '#6b7280' },
  
  // Empty state
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#9ca3af', marginTop: 16 },
  
  // Event card
  eventCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', gap: 16, borderLeftWidth: 4, borderLeftColor: '#6366f1' },
  eventCardLeft: { alignItems: 'center', minWidth: 60 },
  eventCardTime: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  eventCardEndTime: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  eventCardRight: { flex: 1 },
  eventCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  eventCardTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1 },
  eventCardDescription: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  eventCardLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  eventCardLocationText: { fontSize: 13, color: '#6b7280' },
  
  // Task card
  taskCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', gap: 16 },
  taskCardLeft: { alignItems: 'center', justifyContent: 'center', width: 4 },
  priorityIndicator: { width: 4, height: '100%', borderRadius: 2 },
  taskCardRight: { flex: 1 },
  taskCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  taskCardTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1 },
  taskCardDescription: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  taskPriorityBadge: { alignSelf: 'flex-start' },
  taskPriorityText: { fontSize: 12, fontWeight: '600' },
  
  // FAB
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  modalScroll: { padding: 20, maxHeight: 400 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  textArea: { height: 80, textAlignVertical: 'top' },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', gap: 10 },
  dateTimeRow: { flexDirection: 'row', gap: 8 },
  dateButtonHalf: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  button: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f3f4f6' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  createButton: { backgroundColor: '#6366f1' },
  createButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
