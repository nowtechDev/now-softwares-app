import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  screen: string;
}

export default function MoreScreen({ navigation }: any) {
  const { user } = useAuth();

  const menuItems: MenuItem[] = [
    {
      id: '1',
      title: 'Calendário',
      description: 'Gerencie eventos e compromissos',
      icon: 'calendar',
      color: '#3b82f6',
      screen: 'Calendar',
    },
    {
      id: '2',
      title: 'Lembretes',
      description: 'Crie e organize lembretes',
      icon: 'notifications',
      color: '#f59e0b',
      screen: 'Reminders',
    },
    {
      id: '3',
      title: 'Kanban',
      description: 'Organize projetos e tarefas',
      icon: 'grid',
      color: '#8b5cf6',
      screen: 'Kanban',
    },
    {
      id: '4',
      title: 'Financeiro',
      description: 'Relatórios e análises',
      icon: 'cash',
      color: '#10b981',
      screen: 'Financial',
    },
    {
      id: '5',
      title: 'Minha Conta',
      description: 'Editar perfil e configurações',
      icon: 'person',
      color: '#6366f1',
      screen: 'Account',
    },
  ];

  const handleNavigate = (screen: string) => {
    if (screen === 'Financial') {
      // Financial não está implementado ainda
      return;
    }
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mais</Text>
          <Text style={styles.headerSubtitle}>
            {user?.firstName || 'Usuário'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Account')}>
          <View style={styles.profileButton}>
            <Ionicons name="person-circle" size={40} color="#6366f1" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleNavigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#6366f1" />
            <Text style={styles.infoText}>Now CRM v1.0.0</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={20} color="#10b981" />
            <Text style={styles.infoText}>Seus dados estão seguros</Text>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Suporte</Text>
          
          <TouchableOpacity style={styles.supportItem}>
            <Ionicons name="help-circle-outline" size={24} color="#6b7280" />
            <Text style={styles.supportText}>Central de Ajuda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportItem}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#6b7280" />
            <Text style={styles.supportText}>Falar com Suporte</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportItem}>
            <Ionicons name="star-outline" size={24} color="#6b7280" />
            <Text style={styles.supportText}>Avaliar o App</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  infoSection: {
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  supportSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  supportText: {
    fontSize: 15,
    color: '#374151',
  },
});
