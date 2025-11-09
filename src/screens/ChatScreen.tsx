import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';

interface Contact {
  _id: string;
  name?: string;
  phone?: string;
  phone_origin?: string;
  email?: string;
  instagram_id?: string;
  instagram_username?: string;
  instagram_fullname?: string;
  platform?: 'whatsapp' | 'instagram' | 'email';
  image?: string;
  lastMessage?: {
    content: string;
    isOpen: boolean;
    date: string;
    phone_origin?: string;
  };
  unreadCount?: number;
  category?: {
    _id: string;
    name: string;
    color: string;
  };
  tags?: Array<{
    _id: string;
    name: string;
    color: string;
  }>;
}

export default function ChatScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'conversations' | 'all'>('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Contact[]>([]);
  const [allClients, setAllClients] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'whatsapp' | 'instagram' | 'email'>('all');

  // Carregar conversas (contatos com mensagens)
  const loadConversations = async () => {
    try {
      const contacts = await apiService.getOmnichannelContacts({
        withMessages: true,
        populate: 'category,tags',
      });
      
      // ✅ Buscar detalhes da última mensagem para cada contato
      const contactsWithLastMessage = await Promise.all(
        contacts.map(async (contact: any) => {
          if (contact.lastMessageId) {
            try {
              // Buscar mensagem pelo ID
              const message = await apiService.getMessageById(contact.lastMessageId);
              
              if (message) {
                return {
                  ...contact,
                  lastMessage: {
                    content: message.text || message.content || '[Mídia]',
                    isOpen: message.isOpen || false,
                    date: message.date || message.timestamp,
                    phone_origin: message.phone_origin,
                  },
                };
              }
            } catch (err) {
              console.error('Erro ao buscar mensagem:', err);
            }
          }
          return contact;
        })
      );
      
      // ✅ Preservar ordem que vem do backend
      setConversations(contactsWithLastMessage);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      setConversations([]);
    }
  };

  // Carregar todos os clientes
  const loadAllClients = async () => {
    try {
      // ✅ Usar mesma lógica da web: buscar todos os clientes ordenados por nome
      const response = await apiService.getAllClients(1, 1000);
      
      // ✅ Preservar ordem alfabética que vem do backend ($sort[name]=1)
      // Mapear para formato de contato
      const clients: Contact[] = response.data.map((client: any) => ({
        _id: client._id,
        name: client.name || client.client_name || `Cliente ${(client.phone || '').slice(-4)}`,
        phone: client.phone || client.phone_number,
        email: client.email,
        instagram_id: client.instagram_id,
        instagram_username: client.instagram_username,
        instagram_fullname: client.instagram_fullname,
        image: client.linkImgProfile || client.image,
        platform: determinePlatform(client),
        category: client.category_id && typeof client.category_id === 'object' ? {
          _id: client.category_id._id,
          name: client.category_id.name,
          color: client.category_id.color,
        } : undefined,
      }));
      
      setAllClients(clients);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setAllClients([]);
    }
  };

  // Determinar plataforma baseado no cliente
  const determinePlatform = (client: any): 'whatsapp' | 'instagram' | 'email' => {
    if (client.instagram_username || client.instagram_id) return 'instagram';
    if (client.email && !client.phone) return 'email';
    return 'whatsapp';
  };

  // Carregar dados ao montar
  useEffect(() => {
    loadData();
  }, []);

  // Conectar socket e escutar eventos em tempo real
  useEffect(() => {
    console.log('🔌 [ChatScreen] Iniciando conexão socket para chat...');
    console.log('📋 [ChatScreen] Tab ativa:', activeTab);
    socketService.connect();

    // Handler para mensagens criadas/atualizadas
    const handleSocketMessage = async (data: any) => {
      console.log('📨 [ChatScreen] Mensagem socket recebida:', JSON.stringify(data, null, 2));
      console.log('📋 [ChatScreen] Tab atual:', activeTab);
      
      if (activeTab !== 'conversations') {
        console.log('⏭️ [ChatScreen] Ignorando - tab não é conversations');
        return;
      }

      console.log('🔄 [ChatScreen] Atualizando lista de conversas...');

      // Atualizar lista de conversas de forma otimizada
      setConversations(prevConversations => {
        console.log('📊 [ChatScreen] Total de conversas atuais:', prevConversations.length);
        
        // Backend pode enviar em formatos diferentes:
        // 1. { message: { ... }, client_id, ... }
        // 2. { text, content, ... }
        const messageData = data.message || data;
        const clientId = data.client_id;
        const phone = messageData.phone || data.phone;
        
        const contactIndex = prevConversations.findIndex(
          c => c._id === clientId || c.phone === phone
        );

        console.log('🔍 [ChatScreen] Procurando contato - client_id:', clientId, 'phone:', phone);
        console.log('📍 [ChatScreen] Índice encontrado:', contactIndex);

        if (contactIndex !== -1) {
          console.log('✅ [ChatScreen] Contato encontrado - atualizando e movendo para o topo');
          
          // Contato já existe - atualizar última mensagem e mover para o topo
          const updatedContact = {
            ...prevConversations[contactIndex],
            lastMessage: {
              content: messageData.text || messageData.content || '[Mídia]',
              isOpen: messageData.isOpen || false,
              date: messageData.date || messageData.timestamp || new Date().toISOString(),
              phone_origin: messageData.phone_origin,
            },
            unreadCount: messageData.isOpen === false 
              ? (prevConversations[contactIndex].unreadCount || 0) + 1 
              : prevConversations[contactIndex].unreadCount,
          };

          // Remover da posição atual e adicionar no topo
          const newConversations = [...prevConversations];
          newConversations.splice(contactIndex, 1);
          console.log('🔝 [ChatScreen] Movendo contato para o topo');
          return [updatedContact, ...newConversations];
        } else {
          console.log('🆕 [ChatScreen] Novo contato - buscando dados completos...');
          
          // Novo contato - buscar dados completos e adicionar no topo
          apiService.getClients({ _id: data.client_id }).then((response: any) => {
            const client = response.data?.[0];
            if (client) {
              const newContact: Contact = {
                _id: client._id,
                name: client.name || client.client_name,
                phone: client.phone || data.phone,
                platform: data.platform || 'whatsapp',
                image: client.linkImgProfile,
                lastMessage: {
                  content: data.text || data.content || '[Mídia]',
                  isOpen: data.isOpen || false,
                  date: data.date || data.timestamp || new Date().toISOString(),
                  phone_origin: data.phone_origin,
                },
                unreadCount: data.isOpen === false ? 1 : 0,
              };
              
              setConversations(prev => [newContact, ...prev]);
            }
          }).catch((err: any) => console.error('Erro ao buscar cliente:', err));
          
          return prevConversations;
        }
      });
    };

    // Handler para mensagens removidas
    const handleSocketMessageRemoved = (data: any) => {
      console.log('🗑️ [ChatScreen] Mensagem removida:', JSON.stringify(data, null, 2));
      
      // Recarregar conversas apenas se necessário
      if (activeTab === 'conversations') {
        console.log('🔄 [ChatScreen] Recarregando conversas após remoção...');
        loadConversations();
      }
    };

    // Escutar eventos do socket (mesmos da web)
    console.log('👂 [ChatScreen] Adicionando listeners para eventos socket...');
    socketService.on('api/chat created', handleSocketMessage);
    socketService.on('api/chat patched', handleSocketMessage);
    socketService.on('api/chat removed', handleSocketMessageRemoved);
    console.log('✅ [ChatScreen] Listeners adicionados com sucesso');

    // Cleanup ao desmontar
    return () => {
      console.log('🔌 [ChatScreen] Removendo listeners do socket...');
      socketService.off('api/chat created', handleSocketMessage);
      socketService.off('api/chat patched', handleSocketMessage);
      socketService.off('api/chat removed', handleSocketMessageRemoved);
      console.log('✅ [ChatScreen] Listeners removidos');
    };
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadConversations(), loadAllClients()]);
    setLoading(false);
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // Filtrar contatos baseado na busca e plataforma
  const getFilteredContacts = () => {
    const source = activeTab === 'conversations' ? conversations : allClients;
    
    let filtered = source;
    
    // Filtro de plataforma
    if (platformFilter !== 'all') {
      filtered = filtered.filter(c => c.platform === platformFilter);
    }
    
    // Filtro de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => {
        const name = c.name?.toLowerCase() || '';
        const phone = c.phone?.toLowerCase() || '';
        const email = c.email?.toLowerCase() || '';
        const instagram = c.instagram_username?.toLowerCase() || c.instagram_fullname?.toLowerCase() || '';
        return name.includes(query) || phone.includes(query) || email.includes(query) || instagram.includes(query);
      });
    }
    
    return filtered;
  };

  const filteredContacts = getFilteredContacts();

  // Abrir conversa
  const openConversation = (contact: Contact) => {
    // @ts-ignore - Tipagem será ajustada no AppNavigator
    navigation.navigate('Conversation', { contact });
  };

  // Renderizar item da lista
  const renderContactItem = ({ item }: { item: Contact }) => {
    const displayName = item.name || item.phone || item.email || 'Sem nome';
    const avatarUrl = item.image
      ? `https://api-now.sistemasnow.com.br/api/uploads/clients/${item.image}`
      : null;
    
    // Badge da plataforma
    const platformBadge = () => {
      if (!item.lastMessage && activeTab === 'conversations') return null;
      
      const badges = {
        whatsapp: { label: 'WA', color: '#10b981' },
        instagram: { label: 'IG', color: '#a855f7' },
        email: { label: 'Email', color: '#3b82f6' },
      };
      
      const badge = badges[item.platform || 'whatsapp'];
      
      return (
        <View style={[styles.platformBadge, { backgroundColor: badge.color + '20' }]}>
          <Text style={[styles.platformBadgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      );
    };
    
    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => openConversation(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {displayName.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        {/* Informações */}
        <View style={styles.contactInfo}>
          {/* Linha 1: Nome + Categoria + Horário */}
          <View style={styles.contactHeader}>
            <View style={styles.contactNameRow}>
              <Text style={styles.contactName} numberOfLines={1}>
                {displayName}
              </Text>
              {item.category && (
                <View
                  style={[
                    styles.categoryBadgeInline,
                    { backgroundColor: item.category.color + '20', borderColor: item.category.color },
                  ]}
                >
                  <Text style={[styles.categoryBadgeInlineText, { color: item.category.color }]}>
                    {item.category.name}
                  </Text>
                </View>
              )}
              {platformBadge()}
            </View>
            {item.lastMessage && (
              <Text style={styles.messageTime}>
                {formatTime(item.lastMessage.date)}
              </Text>
            )}
          </View>
          
          {/* Linha 2: Preview da mensagem + Badge não lidas */}
          {item.lastMessage && (
            <View style={styles.messageRow}>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage.content}
              </Text>
              {item.unreadCount && item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Linha 3: Tags (até 3, depois +N) */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.slice(0, 3).map((tag) => (
                <View
                  key={tag._id}
                  style={[
                    styles.tagBadge,
                    { backgroundColor: tag.color + '20', borderColor: tag.color },
                  ]}
                >
                  <Text style={[styles.tagBadgeText, { color: tag.color }]}>
                    {tag.name}
                  </Text>
                </View>
              ))}
              {item.tags.length > 3 && (
                <View style={styles.tagMoreBadge}>
                  <Text style={styles.tagMoreText}>+{item.tags.length - 3}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Formatar hora (igual à web)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours24 = 24 * 60 * 60 * 1000;
    
    // Se for menos de 24h, mostrar só hora
    if (diff < hours24) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    }
    
    // Se for mais de 24h, mostrar data + hora
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    }) + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  };

  // Loading inicial
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Carregando conversas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Ionicons name="chatbubbles" size={24} color="#6366f1" />
          <Text style={styles.headerTitle}>Conversas</Text>
        </View>
        
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'conversations' && styles.tabActive]}
            onPress={() => setActiveTab('conversations')}
          >
            <Ionicons
              name="chatbubble-ellipses"
              size={18}
              color={activeTab === 'conversations' ? '#fff' : '#6b7280'}
            />
            <Text style={[styles.tabText, activeTab === 'conversations' && styles.tabTextActive]}>
              Conversas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Ionicons
              name="people"
              size={18}
              color={activeTab === 'all' ? '#fff' : '#6b7280'}
            />
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Busca */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar contatos..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filtro de plataforma */}
        <View style={styles.platformFilters}>
          {(['all', 'whatsapp', 'instagram', 'email'] as const).map((platform) => {
            const icons: Record<typeof platform, any> = {
              all: 'grid' as const,
              whatsapp: 'logo-whatsapp' as const,
              instagram: 'logo-instagram' as const,
              email: 'mail' as const,
            };
            
            return (
              <TouchableOpacity
                key={platform}
                style={[
                  styles.platformFilter,
                  platformFilter === platform && styles.platformFilterActive,
                ]}
                onPress={() => setPlatformFilter(platform)}
              >
                <Ionicons
                  name={icons[platform]}
                  size={18}
                  color={platformFilter === platform ? '#fff' : '#6b7280'}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      {/* Lista de contatos */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item._id}
        renderItem={renderContactItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'conversations' ? 'Nenhuma conversa' : 'Nenhum contato'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'conversations'
                ? 'Suas conversas aparecerão aqui'
                : 'Nenhum cliente encontrado'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  
  // Header
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  
  // Tabs
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  
  // Busca
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#1f2937' },
  
  // Filtros de plataforma
  platformFilters: { flexDirection: 'row', gap: 8 },
  platformFilter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformFilterActive: { backgroundColor: '#6366f1' },
  
  // Lista
  listContainer: { flexGrow: 1 },
  contactItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  avatarImage: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  
  contactInfo: { flex: 1 },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  contactNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  contactName: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1 },
  messageTime: { fontSize: 12, color: '#9ca3af' },
  
  platformBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  platformBadgeText: { fontSize: 10, fontWeight: '600' },
  
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lastMessage: { flex: 1, fontSize: 14, color: '#6b7280' },
  unreadBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  
  phoneOrigin: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  
  // Categoria inline (ao lado do nome)
  categoryBadgeInline: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryBadgeInlineText: { fontSize: 10, fontWeight: '600' },
  
  // Categoria antiga (não usada mais)
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '600' },
  
  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagBadgeText: { fontSize: 10, fontWeight: '600' },
  tagMoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  tagMoreText: { fontSize: 10, fontWeight: '600', color: '#6b7280' },
  
  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
});
