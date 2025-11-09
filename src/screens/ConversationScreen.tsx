import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Pressable,
  Linking,
  Modal,
  ScrollView,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
// import * as DocumentPicker from 'expo-document-picker';
// import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import { apiService } from '../services/api';
import { MediaSkeleton } from '../components/MediaSkeleton';
import CustomerInfo from '../components/CustomerInfo';
import { socketService } from '../services/socket';

interface Contact {
  _id: string;
  name?: string;
  phone?: string;
  phone_origin?: string;
  email?: string;
  instagram_username?: string;
  instagram_fullname?: string;
  platform?: 'whatsapp' | 'instagram' | 'email';
  image?: string;
  lastMessage?: {
    phone_origin?: string;
  };
}

interface Message {
  _id: string;
  content: string;
  text?: string;
  timestamp: string;
  sender: 'user' | 'customer';
  platform: 'whatsapp' | 'instagram' | 'email';
  from?: string;
  to?: string;
  type?: 'text' | 'audio' | 'image' | 'video' | 'document';
  status?: 'sending' | 'sent' | 'delivered' | 'failed';
  hasMedia?: boolean;
  link?: string;
}

export default function ConversationScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);
  
  const contact = (route.params as any)?.contact as Contact;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [renderTrigger, setRenderTrigger] = useState(0); // Contador para forçar re-render
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: string]: boolean }>({});

  // Forçar re-render do componente inteiro quando messages mudar
  const [, forceUpdate] = useState({});
  useEffect(() => {
    console.log('🔄 [ConversationScreen] useEffect - messages mudou! Total:', messages.length);
    setRenderTrigger(prev => prev + 1);
    // Forçar re-render completo do componente
    forceUpdate({});
  }, [messages.length]); // Observa apenas o length para evitar loops infinitos
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [phoneOrigin, setPhoneOrigin] = useState<string | undefined>(contact.lastMessage?.phone_origin || contact.phone_origin);

  // Estados para modais de mídia
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState('');
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoModalUrl, setVideoModalUrl] = useState('');
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [docModalUrl, setDocModalUrl] = useState('');

  // Estado para player de áudio
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPosition, setAudioPosition] = useState(0);
  const [currentAudioUrl, setCurrentAudioUrl] = useState('');

  // Estados para gravação de áudio
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Estado para emoji picker
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  // Estado para CustomerInfo
  const [customerInfoVisible, setCustomerInfoVisible] = useState(false);

  // Estado para menu de opções
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Estado para seletor de plataforma
  const [selectedPlatform, setSelectedPlatform] = useState<'whatsapp' | 'instagram' | 'email'>(
    contact.platform || 'whatsapp'
  );
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);

  // Estados para números WhatsApp
  const [phoneConfigs, setPhoneConfigs] = useState<Array<{
    _id: string;
    platform: 'whatsapp' | 'twilio';
    phone_number: string;
    name: string;
  }>>([]);
  const [selectedPhoneOrigin, setSelectedPhoneOrigin] = useState<string>('auto');

  // Carregar números WhatsApp
  useEffect(() => {
    const loadPhoneConfigs = async () => {
      try {
        console.log('📞 Carregando números WhatsApp...');
        const configs = await apiService.getPhoneConfigs() as Array<{
          _id: string;
          platform: 'whatsapp' | 'twilio';
          phone_number: string;
          name: string;
        }>;
        setPhoneConfigs(configs);
        console.log('✅ Números carregados:', configs.length);
      } catch (error) {
        console.error('❌ Erro ao carregar números WhatsApp:', error);
      }
    };

    loadPhoneConfigs();
  }, []);

  // Definir phoneOrigin padrão baseado na última mensagem
  useEffect(() => {
    if (phoneConfigs.length === 0 || !contact) return;

    // Se a plataforma for WhatsApp e houver phone_origin
    if ((contact.platform === 'whatsapp' || selectedPlatform === 'whatsapp') && phoneOrigin) {
      // Normalizar número para comparação (remover caracteres especiais)
      const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
      const normalizedOrigin = normalizePhone(phoneOrigin);

      // Buscar configuração correspondente
      const matchingConfig = phoneConfigs.find(config => {
        const normalizedConfig = normalizePhone(config.phone_number);
        return normalizedConfig === normalizedOrigin;
      });

      if (matchingConfig) {
        setSelectedPhoneOrigin(matchingConfig._id);
        console.log(`✅ Número padrão definido: ${matchingConfig.phone_number}`);
      } else {
        setSelectedPhoneOrigin('auto');
        console.log('⚠️ Número da última mensagem não encontrado nas configurações, usando Auto');
      }
    }
  }, [phoneConfigs, contact, phoneOrigin, selectedPlatform]);

  // Socket para mensagens em tempo real
  useEffect(() => {
    console.log('🔌 [ConversationScreen] Conectando socket para mensagens em tempo real...');
    console.log('👤 [ConversationScreen] Contato atual:', contact._id, contact.name);
    socketService.connect();

    // Handler para novas mensagens ou atualizações
    const handleSocketMessage = (data: any) => {
      console.log('📨 [ConversationScreen] Nova mensagem via socket:', JSON.stringify(data, null, 2));
      console.log('🔍 [ConversationScreen] Verificando se é deste contato...');
      console.log('   - data.client_id:', data.client_id, 'vs contact._id:', contact._id);
      console.log('   - data.phone:', data.phone, 'vs contact.phone:', contact.phone);
      
      // Verificar se a mensagem é deste contato
      if (data.client_id !== contact._id && data.phone !== contact.phone) {
        console.log('⏭️ [ConversationScreen] Mensagem de outro contato - ignorando');
        return;
      }

      console.log('✅ [ConversationScreen] Mensagem é deste contato - processando...');

      // Backend pode enviar em formatos diferentes:
      // 1. { message: { _id, ... }, client_id, ... }
      // 2. { _id, text, ... }
      const messageData = data.message || data;
      const messageId = messageData._id;
      
      // Garantir que _id existe
      if (!messageId) {
        console.error('❌ [ConversationScreen] Mensagem sem _id, ignorando:', data);
        return;
      }

      // Atualizar mensagens de forma otimizada (sem reload)
      setMessages(prevMessages => {
        console.log('📊 [ConversationScreen] Total de mensagens atuais:', prevMessages.length);
        
        // Verificar se mensagem já existe (evitar duplicatas)
        const messageExists = prevMessages.some(m => m._id === messageId);
        console.log('🔍 [ConversationScreen] Mensagem já existe?', messageExists, 'ID:', messageId);
        
        if (messageExists) {
          console.log('🔄 [ConversationScreen] Atualizando mensagem existente...');
          
          // Atualizar mensagem existente
          return prevMessages.map(m => 
            m._id === messageId 
              ? {
                  ...m,
                  content: messageData.text || messageData.content || m.content,
                  status: messageData.status || m.status,
                  type: messageData.type || m.type,
                  link: messageData.link || m.link,
                }
              : m
          );
        } else {
          console.log('🆕 [ConversationScreen] Adicionando nova mensagem...');
          
          // Nova mensagem - adicionar no final
          const newMessage: Message = {
            _id: messageId,
            content: messageData.text || messageData.content || '',
            timestamp: messageData.date || messageData.timestamp || new Date().toISOString(),
            sender: messageData.sender || (messageData.isOpen === false ? 'client' : 'user'),
            platform: messageData.platform || contact.platform || 'whatsapp',
            status: messageData.status || 'sent',
            type: messageData.type || 'text',
            link: messageData.link,
          };

          console.log('📝 [ConversationScreen] Nova mensagem criada:', newMessage);
          
          // FORÇAR criação de NOVO ARRAY (imutabilidade)
          const newMessages = [...prevMessages, newMessage];
          
          console.log('📊 [ConversationScreen] Total ANTES:', prevMessages.length);
          console.log('📊 [ConversationScreen] Total DEPOIS:', newMessages.length);
          console.log('🔑 [ConversationScreen] Novo array criado:', newMessages !== prevMessages);
          
          // useEffect vai detectar a mudança e incrementar o trigger
          return newMessages;
        }
      });
    };

    // Handler para mensagens removidas
    const handleSocketMessageRemoved = (data: any) => {
      console.log('🗑️ [ConversationScreen] Mensagem removida via socket:', JSON.stringify(data, null, 2));
      
      // Verificar se é deste contato
      if (data.client_id !== contact._id && data.phone !== contact.phone) {
        console.log('⏭️ [ConversationScreen] Mensagem de outro contato - ignorando remoção');
        return;
      }

      console.log('🗑️ [ConversationScreen] Removendo mensagem do estado...');
      
      // Remover mensagem do estado
      setMessages(prevMessages => {
        const filtered = prevMessages.filter(m => m._id !== data._id);
        console.log('✅ [ConversationScreen] Mensagem removida. Total restante:', filtered.length);
        return filtered;
      });
    };

    // Escutar eventos
    console.log('👂 [ConversationScreen] Adicionando listeners para eventos socket...');
    socketService.on('api/chat created', handleSocketMessage);
    socketService.on('api/chat patched', handleSocketMessage);
    socketService.on('api/chat removed', handleSocketMessageRemoved);
    console.log('✅ [ConversationScreen] Listeners adicionados com sucesso');

    // Cleanup
    return () => {
      console.log('🔌 [ConversationScreen] Removendo listeners de mensagens...');
      socketService.off('api/chat created', handleSocketMessage);
      socketService.off('api/chat patched', handleSocketMessage);
      socketService.off('api/chat removed', handleSocketMessageRemoved);
      console.log('✅ [ConversationScreen] Listeners removidos');
    };
  }, [contact._id, contact.phone]);

  // Configurar modo de áudio
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Erro ao configurar áudio:', error);
      }
    };
    
    configureAudio();
  }, []);

  // Carregar mensagens
  useEffect(() => {
    if (contact) {
      loadMessages();
    }
  }, [contact]);

  // Scroll para o final quando mensagens carregam
  // Usando inverted={true} no FlatList, não precisamos fazer scroll manual
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // Com inverted, o scroll já começa no final automaticamente
    }
  }, [messages.length, loading]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // Tentar buscar por client_id primeiro
      const response = await apiService.getMessagesByClientId(
        contact._id,
        phoneOrigin
      );
      
      if (response.messages && response.messages.length > 0) {
        const formattedMessages: Message[] = response.messages.map((msg: any) => ({
          _id: msg._id,
          content: msg.content || msg.text || msg.caption || '',
          text: msg.text,
          timestamp: msg.createdAt || msg.date,
          sender: determineSender(msg),
          platform: contact.platform || 'whatsapp',
          from: msg.from,
          to: msg.to,
          type: msg.type || 'text',
          status: msg.status || 'sent',
          hasMedia: msg.hasMedia || false,
          link: msg.link,
        }));
        
        // Inverter ordem: backend retorna decrescente, mas precisamos crescente
        // (mais antigas primeiro, mais novas no final)
        setMessages(formattedMessages.reverse());
        // ✅ Não precisa marcar como lida aqui - já é feito na API com mark_as_read=true
      } else {
        // Fallback: buscar por contato
        const fallbackMessages = await apiService.getMessagesByContact(
          contact._id,
          phoneOrigin
        );
        
        const formatted: Message[] = fallbackMessages.map((msg: any) => ({
          _id: msg._id,
          content: msg.content || msg.text || msg.caption || '',
          text: msg.text,
          timestamp: msg.createdAt || msg.date,
          sender: determineSender(msg),
          platform: contact.platform || 'whatsapp',
          from: msg.from,
          to: msg.to,
          type: msg.type || 'text',
          status: msg.status || 'sent',
          hasMedia: msg.hasMedia || false,
          link: msg.link,
        }));
        
        // Inverter ordem: backend retorna decrescente, mas precisamos crescente
        setMessages(formatted.reverse());
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Determinar quem enviou a mensagem
  const determineSender = (msg: any): 'user' | 'customer' => {
    const isSent = (
      msg.eventType === 'sent' ||
      msg.event === 'sent' ||
      msg.eventType === 'message_sent' ||
      msg.event === 'sending'
    );
    return isSent ? 'user' : 'customer';
  };

  // Formatar timestamp da mensagem (igual à web)
  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    
    // Calcular diferença em horas
    const diffMs = now.getTime() - messageDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Se mais de 24h, mostrar data completa
    if (diffHours >= 24) {
      return messageDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }).replace(',', ' às');
    }
    
    // Se menos de 24h, mostrar só hora
    return messageDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  };

  // Detectar tipo de mídia por extensão
  const detectType = (url: string): 'image' | 'video' | 'audio' | 'document' => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
      return 'image';
    }
    if (['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(ext)) {
      return 'video';
    }
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'opus'].includes(ext)) {
      return 'audio';
    }
    return 'document';
  };

  // Processar URL de mídia (igual à web)
  const processMediaUrl = (content: string, linkField?: string) => {
    // Se tem linkField, é mídia anexada
    if (linkField) {
      // Se já é URL completa
      if (linkField.startsWith('http')) {
        return { url: linkField, type: detectType(linkField) };
      }
      
      // Se é caminho relativo, adiciona domínio
      const url = `https://api-now.sistemasnow.com.br${linkField}`;
      return { url, type: detectType(linkField) };
    }
    
    // Se não tem linkField, verificar se content tem URL de arquivo (não é link de texto)
    const urlMatch = content?.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      const url = urlMatch[0];
      // Só tratar como mídia se tiver extensão de arquivo
      const hasFileExtension = /\.(jpg|jpeg|png|gif|webp|bmp|mp4|avi|mov|webm|mkv|mp3|wav|ogg|aac|m4a|opus|pdf|doc|docx|xls|xlsx)$/i.test(url);
      
      if (hasFileExtension) {
        return { url, type: detectType(url) };
      }
    }
    
    return null;
  };

  // Formatar tempo do áudio
  const formatAudioTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para anexar arquivos
  const handleAttachment = () => {
    Alert.alert(
      'Anexar Arquivo',
      'Escolha o tipo de arquivo',
      [
        { text: 'Imagem', onPress: () => Alert.alert('Em breve', 'Funcionalidade de imagem será implementada') },
        { text: 'Documento', onPress: () => Alert.alert('Em breve', 'Funcionalidade de documento será implementada') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Função para abrir emoji picker
  const handleEmoji = () => {
    setEmojiPickerOpen(true);
  };

  // Função quando emoji é selecionado
  const handleEmojiSelected = (emoji: EmojiType) => {
    setMessageInput(messageInput + emoji.emoji);
  };

  // Função para iniciar gravação de áudio
  const startRecording = async () => {
    try {
      console.log('🎤 Solicitando permissão de áudio...');
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permissão negada', 'É necessário permitir o acesso ao microfone.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('🎤 Iniciando gravação...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      console.log('✅ Gravação iniciada');
    } catch (err) {
      console.error('❌ Erro ao iniciar gravação:', err);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  };

  // Função para parar gravação e transcrever
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      console.log('⏹️ Parando gravação...');
      setIsRecording(false);
      setIsTranscribing(true);
      
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      console.log('📁 Áudio gravado em:', uri);
      
      if (uri) {
        await transcribeAudio(uri);
      }
      
      setRecording(null);
    } catch (err) {
      console.error('❌ Erro ao parar gravação:', err);
      Alert.alert('Erro', 'Não foi possível parar a gravação.');
      setIsTranscribing(false);
    }
  };

  // Função para transcrever áudio usando IA
  const transcribeAudio = async (audioUri: string) => {
    try {
      console.log('🤖 Iniciando transcrição...');
      console.log('📁 URI do áudio:', audioUri);

      // Criar FormData
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('language', 'pt');

      console.log('📤 Enviando áudio para transcrição...');
      
      // Buscar token
      const token = await apiService.getAccessToken();
      
      const response = await fetch(
        'https://api-now.sistemasnow.com.br/api/agents/audio-transcription',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      console.log('📥 Resposta da transcrição:', result);

      if (result.success && result.data?.transcription) {
        // Adicionar transcrição ao input
        const currentText = messageInput.trim();
        const newText = currentText 
          ? `${currentText} ${result.data.transcription}`
          : result.data.transcription;
        
        setMessageInput(newText);
        console.log('✅ Transcrição adicionada ao input');
      } else {
        throw new Error(result.error || 'Erro na transcrição');
      }
    } catch (error) {
      console.error('❌ Erro na transcrição:', error);
      Alert.alert(
        'Erro na transcrição',
        'Não foi possível transcrever o áudio. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  // Função para alternar gravação
  const handleAudio = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Função para agendar mensagem
  const handleSchedule = () => {
    Alert.alert('Em breve', 'Agendamento de mensagens será implementado');
  };

  // Função para abrir menu de opções
  const handleOptionsMenu = () => {
    Alert.alert(
      'Opções',
      'Escolha uma opção',
      [
        {
          text: 'Detalhes do contato',
          onPress: () => setCustomerInfoVisible(true),
        },
        {
          text: 'Buscar mensagem',
          onPress: () => {
            setCustomerInfoVisible(true);
            // TODO: Focar no campo de busca
          },
        },
        {
          text: 'Tags',
          onPress: () => Alert.alert('Em breve', 'Gestão de tags será implementada'),
        },
        {
          text: 'Categorias',
          onPress: () => Alert.alert('Em breve', 'Gestão de categorias será implementada'),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Função para selecionar número WhatsApp
  const handleSelectPhoneOrigin = () => {
    if (phoneConfigs.length === 0) {
      Alert.alert('Atenção', 'Nenhum número WhatsApp configurado.');
      return;
    }

    const whatsappConfigs = phoneConfigs.filter(c => c.platform === 'whatsapp' || c.platform === 'twilio');

    Alert.alert(
      'Selecionar Número',
      'Por qual número deseja enviar?',
      [
        { 
          text: 'Auto', 
          onPress: () => {
            setSelectedPhoneOrigin('auto');
            console.log('✅ Número: Auto');
          }
        },
        ...whatsappConfigs.map(config => ({
          text: `${config.name} (${config.phone_number})`,
          onPress: () => {
            setSelectedPhoneOrigin(config._id);
            console.log(`✅ Número selecionado: ${config.phone_number}`);
          },
        })),
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Função para alternar plataforma
  const handlePlatformChange = () => {
    const platforms: Array<'whatsapp' | 'instagram' | 'email'> = ['whatsapp', 'instagram', 'email'];
    const platformLabels = {
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      email: 'Email',
    };

    Alert.alert(
      'Selecionar Plataforma',
      'Escolha por qual canal deseja enviar a mensagem',
      [
        ...platforms.map(platform => ({
          text: platformLabels[platform],
          onPress: () => {
            setSelectedPlatform(platform);
            console.log(`✅ Plataforma alterada para: ${platform}`);
            
            // Se for WhatsApp, perguntar número
            if (platform === 'whatsapp') {
              setTimeout(() => handleSelectPhoneOrigin(), 300);
            }
          },
        })),
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Controlar reprodução de áudio
  const toggleAudio = async (url: string) => {
    try {
      // Se é um áudio diferente, parar o atual
      if (currentAudioUrl !== url && sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }

      // Se é o mesmo áudio
      if (currentAudioUrl === url && sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      // Carregar novo áudio
      setCurrentAudioUrl(url);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      alert('Erro ao reproduzir áudio');
    }
  };

  // Atualizar status do áudio
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setAudioDuration(status.durationMillis || 0);
      setAudioPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setAudioPosition(0);
      }
    }
  };

  // Limpar áudio ao desmontar
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Download de arquivo
  const downloadFile = async (url: string) => {
    try {
      const filename = url.split('/').pop() || 'download';
      const fileUri = FileSystem.documentDirectory + filename;
      
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);
      
      if (downloadResult.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadResult.uri);
        } else {
          alert('Arquivo baixado: ' + downloadResult.uri);
        }
      }
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      alert('Erro ao baixar arquivo');
    }
  };

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending) return;
    
    // Validar se tem número selecionado para WhatsApp
    if (selectedPlatform === 'whatsapp') {
      const phoneOriginToUse = selectedPhoneOrigin === 'auto' 
        ? phoneOrigin 
        : phoneConfigs.find(c => c._id === selectedPhoneOrigin)?.phone_number;

      if (!phoneOriginToUse) {
        Alert.alert(
          'Número não selecionado',
          'Por favor, selecione um número WhatsApp para enviar a mensagem.',
          [
            { 
              text: 'Selecionar Número', 
              onPress: () => handleSelectPhoneOrigin() 
            },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
        return;
      }
    }
    
    const message = messageInput.trim();
    setMessageInput('');
    setSending(true);
    
    try {
      // Adicionar mensagem otimista na UI
      const tempMessage: Message = {
        _id: `temp-${Date.now()}`,
        content: message,
        timestamp: new Date().toISOString(),
        sender: 'user',
        platform: selectedPlatform,
        status: 'sending',
        type: 'text',
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      // Scroll para o final
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      console.log(`📤 Enviando mensagem via ${selectedPlatform}...`);
      
      // Enviar para API baseado na plataforma selecionada
      if (selectedPlatform === 'whatsapp') {
        // Buscar connection_id (que é o _id do phoneConfig)
        const connectionId = selectedPhoneOrigin === 'auto' 
          ? phoneConfigs.find(c => c.phone_number === phoneOrigin)?._id
          : selectedPhoneOrigin;

        const phoneOriginToUse = selectedPhoneOrigin === 'auto' 
          ? phoneOrigin 
          : phoneConfigs.find(c => c._id === selectedPhoneOrigin)?.phone_number;

        console.log(`📞 Enviando WhatsApp:`);
        console.log(`   - Para: ${contact.phone}`);
        console.log(`   - De: ${phoneOriginToUse}`);
        console.log(`   - Connection ID: ${connectionId}`);
        console.log(`   - Mensagem: ${message}`);

        if (!contact.phone) {
          throw new Error('Telefone do contato não encontrado');
        }

        if (!connectionId) {
          throw new Error('Connection ID não encontrado');
        }

        await apiService.sendWhatsAppMessage({
          phone: contact.phone,
          message,
          connectionId: connectionId,
        });
      } else if (selectedPlatform === 'instagram') {
        // TODO: Implementar envio Instagram
        console.log('📷 Envio Instagram ainda não implementado');
        Alert.alert('Em breve', 'Envio de mensagens pelo Instagram será implementado em breve.');
      } else if (selectedPlatform === 'email') {
        // TODO: Implementar envio Email
        console.log('📧 Envio Email ainda não implementado');
        Alert.alert('Em breve', 'Envio de mensagens por Email será implementado em breve.');
      }
      
      // Recarregar mensagens
      await loadMessages();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  // Componente de mídia com skeleton loading (seguindo padrão web)
  const MediaMessage = ({ item, isUser }: { item: Message; isUser: boolean }) => {
    const [mediaLoaded, setMediaLoaded] = useState(false);
    const screenWidth = Dimensions.get('window').width;
    const mediaWidth = screenWidth * 0.65;
    const mediaHeight = mediaWidth * 0.75; // Proporção 4:3

    // Processar mídia igual à web
    const mediaFromContent = processMediaUrl(item.content, item.link);
    
    // Se tem tipo definido e campo link
    if (item.type && item.link && ['image', 'video', 'audio', 'document'].includes(item.type)) {
      let url = item.link;
      if (!url.startsWith('http')) {
        url = `https://api-now.sistemasnow.com.br${url}`;
      }
      
      const finalType = item.type as 'image' | 'video' | 'audio' | 'document';
      const finalUrl = url;
      
      // Renderizar baseado no tipo
      return renderMediaByType(finalUrl, finalType, mediaWidth, mediaHeight, mediaLoaded, setMediaLoaded, isUser);
    }
    
    // Se processou do content/link
    if (mediaFromContent) {
      return renderMediaByType(mediaFromContent.url, mediaFromContent.type, mediaWidth, mediaHeight, mediaLoaded, setMediaLoaded, isUser);
    }
    
    return null;
  };
  
  // Renderizar mídia por tipo
  const renderMediaByType = (
    url: string,
    type: 'image' | 'video' | 'audio' | 'document',
    mediaWidth: number,
    mediaHeight: number,
    mediaLoaded: boolean,
    setMediaLoaded: (loaded: boolean) => void,
    isUser: boolean
  ) => {

    // Imagem
    if (type === 'image') {
      return (
        <Pressable onPress={() => {
          setImageModalUrl(url);
          setImageModalVisible(true);
        }}>
          <View style={[styles.mediaContainer, { width: mediaWidth, height: mediaHeight }]}>
            {/* Skeleton/Ghost enquanto carrega */}
            {!mediaLoaded && (
              <View style={styles.mediaSkeletonContainer}>
                <MediaSkeleton type="image" width={mediaWidth} height={mediaHeight} />
              </View>
            )}
            <Image
              source={{ uri: url }}
              style={[
                styles.mediaImage,
                { width: mediaWidth, height: mediaHeight },
                { opacity: mediaLoaded ? 1 : 0 } // Fade in quando carregar
              ]}
              resizeMode="cover"
              onLoadStart={() => setMediaLoaded(false)}
              onLoad={() => setMediaLoaded(true)}
              onError={() => setMediaLoaded(false)}
            />
          </View>
        </Pressable>
      );
    }

    // Vídeo
    if (type === 'video') {
      // Criar player para thumbnail (sem autoplay)
      const thumbnailPlayer = useVideoPlayer(url, player => {
        player.loop = false;
        player.muted = true;
        // Não dar play automaticamente
      });

      return (
        <Pressable onPress={() => {
          setVideoModalUrl(url);
          setVideoModalVisible(true);
        }}>
          <View style={[styles.mediaContainer, { width: mediaWidth, height: mediaHeight }]}>
            {/* Thumbnail do vídeo usando VideoView */}
            <VideoView
              player={thumbnailPlayer}
              style={[
                styles.mediaImage,
                { width: mediaWidth, height: mediaHeight }
              ]}
              nativeControls={false}
            />
            
            {/* Overlay com botão play */}
            <View style={styles.videoOverlay}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={32} color="#ffffff" />
              </View>
            </View>
          </View>
        </Pressable>
      );
    }

    // Áudio
    if (type === 'audio') {
      const isCurrentAudio = currentAudioUrl === url;
      const isThisPlaying = isCurrentAudio && isPlaying;
      
      return (
        <Pressable onPress={() => toggleAudio(url)}>
          <View style={styles.audioMessage}>
            <Ionicons 
              name={isThisPlaying ? 'pause-circle' : 'play-circle'} 
              size={40} 
              color={isUser ? '#fff' : '#6366f1'} 
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.audioText, isUser && { color: '#fff' }]}>
                Mensagem de áudio
              </Text>
              {isCurrentAudio && audioDuration > 0 ? (
                <Text style={[styles.audioTime, isUser && { color: '#e0e0e0' }]}>
                  {formatAudioTime(audioPosition)} / {formatAudioTime(audioDuration)}
                </Text>
              ) : (
                <Text style={[styles.audioTime, isUser && { color: '#e0e0e0' }]}>
                  Toque para reproduzir
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      );
    }

    // Documento
    if (type === 'document') {
      return (
        <Pressable onPress={() => {
          setDocModalUrl(url);
          setDocModalVisible(true);
        }}>
          <View style={styles.documentMessage}>
            <Ionicons name="document-text" size={40} color={isUser ? '#fff' : '#6366f1'} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.documentText, isUser && { color: '#fff' }]}>
                Documento
              </Text>
              <Text style={[styles.documentSubtext, isUser && { color: '#e0e0e0' }]}>
                Toque para abrir
              </Text>
            </View>
          </View>
        </Pressable>
      );
    }

    return null;
  };

  // Verificar se mensagem tem mídia
  const hasMedia = (item: Message) => {
    if (item.type && ['image', 'video', 'audio', 'document'].includes(item.type) && item.link) {
      return true;
    }
    const mediaFromContent = processMediaUrl(item.content, item.link);
    return mediaFromContent !== null;
  };

  // Renderizar texto com formatação (negrito, itálico e links)
  const renderTextWithFormatting = (text: string, isUser: boolean, itemLink?: string) => {
    // Se o texto é apenas uma URL e é igual ao link da mídia, não mostrar
    if (itemLink && text.trim() === itemLink) {
      return null;
    }
    
    // Se o texto contém apenas uma URL de mídia (storage.googleapis, etc), não mostrar
    const urlOnlyRegex = /^https?:\/\/[^\s]+$/;
    if (urlOnlyRegex.test(text.trim()) && (
      text.includes('storage.googleapis') ||
      text.includes('sistemasnow') ||
      text.includes('.mp4') ||
      text.includes('.pdf') ||
      text.includes('.jpg') ||
      text.includes('.png')
    )) {
      return null;
    }
    
    // Regex para capturar URLs, texto em negrito (*texto*) e itálico (_texto_)
    const combinedRegex = /(https?:\/\/[^\s]+|\*[^*]+\*|_[^_]+_)/g;
    const parts = text.split(combinedRegex);
    
    return (
      <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextCustomer]}>
        {parts.map((part, index) => {
          // Link
          if (/^https?:\/\//.test(part)) {
            return (
              <Text
                key={index}
                style={styles.link}
                onPress={() => Linking.openURL(part)}
              >
                {part}
              </Text>
            );
          }
          
          // Negrito (*texto*)
          if (/^\*[^*]+\*$/.test(part)) {
            const boldText = part.slice(1, -1); // Remove os *
            return (
              <Text key={index} style={styles.boldText}>
                {boldText}
              </Text>
            );
          }
          
          // Itálico (_texto_)
          if (/^_[^_]+_$/.test(part)) {
            const italicText = part.slice(1, -1); // Remove os _
            return (
              <Text key={index} style={styles.italicText}>
                {italicText}
              </Text>
            );
          }
          
          // Texto normal
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  // Renderizar mensagem
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    const itemHasMedia = hasMedia(item);
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.messageUser : styles.messageCustomer]}>
        <View style={[styles.messageBubble, isUser ? styles.bubbleUser : styles.bubbleCustomer]}>
          {/* Mídia (se houver) */}
          <MediaMessage item={item} isUser={isUser} />
          
          {/* Texto (só mostra se NÃO tiver mídia) */}
          {item.content && !itemHasMedia && renderTextWithFormatting(item.content, isUser, item.link)}
          
          {/* Footer */}
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isUser && styles.messageTimeUser]}>
              {formatMessageTime(item.timestamp)}
            </Text>
            {isUser && (
              <View style={styles.statusIcons}>
                {item.status === 'sending' && (
                  <Ionicons name="time-outline" size={14} color="#9ca3af" />
                )}
                {item.status === 'sent' && (
                  <Ionicons name="checkmark" size={14} color="#9ca3af" />
                )}
                {item.status === 'delivered' && (
                  <Ionicons name="checkmark-done" size={14} color="#9ca3af" />
                )}
                {item.status === 'failed' && (
                  <Ionicons name="close-circle" size={14} color="#ef4444" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Componente de Modal de Vídeo com expo-video
  const VideoModal = () => {
    const player = useVideoPlayer(videoModalVisible ? videoModalUrl : '', player => {
      if (videoModalVisible && videoModalUrl) {
        player.loop = false;
        player.play();
      }
    });

    if (!videoModalVisible) return null;

    return (
      <Modal
        visible={videoModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          player.pause();
          setVideoModalVisible(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {/* Header com botões */}
          <SafeAreaView style={{ backgroundColor: '#1f2937' }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => {
                  player.pause();
                  setVideoModalVisible(false);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-circle" size={36} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => downloadFile(videoModalUrl)}
                style={styles.modalDownloadButtonHeader}
              >
                <Ionicons name="download" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          
          {/* Player de vídeo */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <VideoView
              player={player}
              style={{ width: '100%', height: '100%' }}
              allowsFullscreen
              allowsPictureInPicture
              nativeControls
            />
          </View>
        </View>
      </Modal>
    );
  };

  // Nome de exibição do contato
  const displayName = contact.name || contact.phone || 'Contato';
  
  // Avatar
  const avatarUrl = contact.image
    ? `https://api-now.sistemasnow.com.br/api/uploads/clients/${contact.image}`
    : null;
  
  // Badge da plataforma
  const platformBadge = () => {
    const badges = {
      whatsapp: { label: 'WhatsApp', color: '#10b981' },
      instagram: { label: 'Instagram', color: '#a855f7' },
      email: { label: 'Email', color: '#3b82f6' },
    };
    
    const badge = badges[contact.platform || 'whatsapp'];
    
    return (
      <View style={[styles.headerBadge, { backgroundColor: badge.color + '20' }]}>
        <Text style={[styles.headerBadgeText, { color: badge.color }]}>{badge.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerInfo}
          onPress={() => setCustomerInfoVisible(true)}
        >
          <View style={styles.headerAvatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.headerAvatarImage} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarText}>
                  {displayName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>
              {displayName}
            </Text>
            {platformBadge()}
            {phoneOrigin && (
              <Text style={styles.headerPhone} numberOfLines={1}>
                {phoneOrigin}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleOptionsMenu}>
          <Ionicons name="ellipsis-vertical" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      {/* Mensagens */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Carregando mensagens...</Text>
          </View>
        ) : (
          <ScrollView
            ref={flatListRef as any}
            contentContainerStyle={styles.messagesList}
            style={{ flex: 1 }}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>Nenhuma mensagem ainda</Text>
                <Text style={styles.emptySubtext}>Envie uma mensagem para iniciar a conversa</Text>
              </View>
            ) : (
              messages.map((item, index) => (
                <View key={item._id}>
                  {renderMessage({ item })}
                </View>
              ))
            )}
          </ScrollView>
        )}
        
        {/* Botões de ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAttachment}>
            <Ionicons name="attach-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleEmoji}>
            <Ionicons name="happy-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              isRecording && styles.recordingButton,
              isTranscribing && styles.transcribingButton
            ]} 
            onPress={handleAudio}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Ionicons 
                name={isRecording ? "stop-circle" : "mic-outline"} 
                size={24} 
                color={isRecording ? "#ef4444" : "#6366f1"} 
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleSchedule}>
            <Ionicons name="time-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>
        
        {/* Input de mensagem */}
        <View style={styles.inputContainer}>
          {/* Seletor de Plataforma */}
          <TouchableOpacity 
            style={[
              styles.platformButton,
              selectedPlatform === 'whatsapp' && styles.platformButtonWhatsApp,
              selectedPlatform === 'instagram' && styles.platformButtonInstagram,
              selectedPlatform === 'email' && styles.platformButtonEmail,
            ]}
            onPress={handlePlatformChange}
          >
            <Ionicons 
              name={
                selectedPlatform === 'whatsapp' ? 'logo-whatsapp' :
                selectedPlatform === 'instagram' ? 'logo-instagram' :
                'mail'
              }
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#9ca3af"
            value={messageInput}
            onChangeText={setMessageInput}
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, (!messageInput.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageInput.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Informação do número selecionado */}
        {selectedPlatform === 'whatsapp' && selectedPhoneOrigin !== 'auto' && (
          <View style={styles.phoneOriginInfo}>
            <Text style={styles.phoneOriginText}>
              Enviando por: {phoneConfigs.find(c => c._id === selectedPhoneOrigin)?.phone_number || 'Auto'}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Modal de Imagem */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Botão fechar - canto superior direito */}
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close-circle" size={44} color="#fff" />
          </TouchableOpacity>
          
          {/* Imagem com zoom */}
          <ScrollView 
            contentContainerStyle={styles.modalContent}
            minimumZoomScale={1}
            maximumZoomScale={3}
          >
            <Image
              source={{ uri: imageModalUrl }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </ScrollView>
          
          {/* Botão download - parte inferior */}
          <TouchableOpacity 
            style={styles.modalDownloadButton}
            onPress={() => downloadFile(imageModalUrl)}
          >
            <Ionicons name="download" size={24} color="#fff" />
            <Text style={styles.modalDownloadText}>Baixar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal de Vídeo */}
      <VideoModal />

      {/* Modal de Documento */}
      <Modal
        visible={docModalVisible}
        transparent={false}
        onRequestClose={() => setDocModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDocModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => downloadFile(docModalUrl)}>
              <Ionicons name="download" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <WebView
            source={{ uri: docModalUrl }}
            style={{ flex: 1 }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Carregando documento...</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Emoji Picker */}
      <EmojiPicker
        onEmojiSelected={handleEmojiSelected}
        open={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        enableSearchBar
        enableRecentlyUsed
        categoryPosition="top"
        theme={{
          backdrop: '#00000080',
          knob: '#6366f1',
          container: '#ffffff',
          header: '#f3f4f6',
          skinTonesContainer: '#f3f4f6',
          category: {
            icon: '#6b7280',
            iconActive: '#6366f1',
            container: '#f3f4f6',
            containerActive: '#e0e7ff',
          },
        }}
      />

      {/* Customer Info */}
      <CustomerInfo
        visible={customerInfoVisible}
        contact={contact}
        onClose={() => setCustomerInfoVisible(false)}
        onUpdate={(contactId, data) => {
          console.log('✅ Cliente atualizado:', contactId, data);
          // Recarregar mensagens se necessário
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: { padding: 4, marginRight: 8 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  headerAvatarImage: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  headerText: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
  headerBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 2 },
  headerBadgeText: { fontSize: 10, fontWeight: '600' },
  headerPhone: { fontSize: 12, color: '#6b7280' },
  headerButton: { padding: 4 },
  
  // Content
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  
  // Messages
  messagesList: { padding: 16, flexGrow: 1 },
  messageContainer: { marginBottom: 12, maxWidth: '80%' },
  messageUser: { alignSelf: 'flex-end' },
  messageCustomer: { alignSelf: 'flex-start' },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  bubbleCustomer: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTextUser: { color: '#fff' },
  messageTextCustomer: { color: '#1f2937' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  messageTime: { fontSize: 11, color: '#6b7280' },
  messageTimeUser: { color: '#e0e7ff' },
  statusIcons: { flexDirection: 'row' },
  
  // Mídia
  mediaContainer: { marginBottom: 8, position: 'relative' },
  mediaSkeletonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  mediaImage: { width: '100%', height: 200, borderRadius: 12 },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    minWidth: 250,
    marginBottom: 8,
  },
  audioText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  audioTime: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  documentMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    minWidth: 250,
    marginBottom: 8,
  },
  documentText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  documentSubtext: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  
  // Links
  link: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
  
  // Formatação de texto
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },
  
  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  
  // Botões de ação
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    padding: 8,
  },
  recordingButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 20,
  },
  transcribingButton: {
    backgroundColor: '#dbeafe',
    borderRadius: 20,
  },
  
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  inputButton: { padding: 4 },
  platformButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformButtonWhatsApp: {
    backgroundColor: '#10b981',
  },
  platformButtonInstagram: {
    backgroundColor: '#a855f7',
  },
  platformButtonEmail: {
    backgroundColor: '#3b82f6',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  phoneOriginInfo: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  phoneOriginText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#6b7280',
  },
  
  // Modais
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 22,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  modalDownloadButton: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  modalDownloadButtonHeader: {
    padding: 8,
  },
  modalDownloadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1f2937',
  },
  modalVideo: {
    flex: 1,
    backgroundColor: '#000',
  },
});
