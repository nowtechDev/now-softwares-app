import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 cards por linha com padding

interface ShortcutCard {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  screen: string;
}

interface KPIData {
  totalClients: number;
  activeProspects: number;
  monthlyRevenue: number;
  conversionRate: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<KPIData>({
    totalClients: 0,
    activeProspects: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const shortcuts: ShortcutCard[] = [
    {
      id: '1',
      title: 'Chat',
      icon: 'chatbubbles',
      color: '#10b981',
      screen: 'Chat',
    },
    {
      id: '2',
      title: 'Calendário',
      icon: 'calendar',
      color: '#3b82f6',
      screen: 'Calendar',
    },
    {
      id: '3',
      title: 'Lembretes',
      icon: 'notifications',
      color: '#f59e0b',
      screen: 'Reminders',
    },
    {
      id: '4',
      title: 'Kanban',
      icon: 'grid',
      color: '#8b5cf6',
      screen: 'Kanban',
    },
    {
      id: '5',
      title: 'Financeiro',
      icon: 'cash',
      color: '#ef4444',
      screen: 'Financial',
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Busca dados do dashboard
      const [statsData, activities, events] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getRecentActivities(5),
        apiService.getCalendarEvents(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      ]);

      setStats(statsData);
      setRecentActivities(activities);
      setUpcomingEvents(events.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleShortcutPress = (screen: string) => {
    // @ts-ignore
    navigation.navigate(screen);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
          />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>
            {user?.firstName || user?.email?.split('@')[0] || 'Usuário'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => (navigation as any).navigate('Account')}
        >
          <Ionicons name="person-circle" size={40} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Atalhos Rápidos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acesso Rápido</Text>
        <View style={styles.shortcutsGrid}>
          {shortcuts.map((shortcut) => (
            <TouchableOpacity
              key={shortcut.id}
              style={[styles.shortcutCard, { borderLeftColor: shortcut.color }]}
              onPress={() => handleShortcutPress(shortcut.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: shortcut.color }]}>
                <Ionicons name={shortcut.icon} size={28} color="#fff" />
              </View>
              <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* KPIs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Indicadores</Text>
        
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Ionicons name="people" size={24} color="#6366f1" />
            <Text style={styles.kpiLabel}>Total de Clientes</Text>
          </View>
          <Text style={styles.kpiValue}>{stats.totalClients}</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Ionicons name="cash" size={24} color="#10b981" />
            <Text style={styles.kpiLabel}>Receita do Período</Text>
          </View>
          <Text style={styles.kpiValue}>{formatCurrency(stats.monthlyRevenue)}</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Ionicons name="trending-up" size={24} color="#f59e0b" />
            <Text style={styles.kpiLabel}>Taxa de Conversão</Text>
          </View>
          <Text style={styles.kpiValue}>{stats.conversionRate}%</Text>
        </View>
      </View>

      {/* Atividades Recentes */}
      {recentActivities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividades Recentes</Text>
          {recentActivities.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText} numberOfLines={2}>
                  {activity.description || activity.title || 'Atividade'}
                </Text>
                <Text style={styles.activityTime}>
                  {new Date(activity.createdAt).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Próximos Eventos */}
      {upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          {upcomingEvents.map((event, index) => (
            <View key={index} style={styles.eventItem}>
              <View style={[styles.eventColor, { backgroundColor: event.color || '#6366f1' }]} />
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {event.title}
                </Text>
                <Text style={styles.eventDate}>
                  {new Date(event.startDateTime).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shortcutCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shortcutIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  kpiCard: {
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
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventColor: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: '#6b7280',
  },
});
