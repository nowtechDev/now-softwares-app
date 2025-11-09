import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

interface Contact {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  instagram_username?: string;
  instagram_fullname?: string;
  platform?: string;
  company?: string;
  cpf?: string;
  cnpj?: string;
  // Endereço
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  uf?: string;
  zipCode?: string;
  notes?: string;
}

interface CustomerInfoProps {
  visible: boolean;
  contact: Contact | null;
  onClose: () => void;
  onUpdate?: (contactId: string, data: Partial<Contact>) => void;
}

export default function CustomerInfo({ visible, contact, onClose, onUpdate }: CustomerInfoProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'address'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const handleSave = async () => {
    if (!contact || !editingField) return;

    setSaving(true);
    try {
      const updateData = { [editingField]: editValue };
      
      await apiService.updateClient(contact._id, updateData);
      
      // Atualizar contact localmente para refletir mudança imediatamente
      Object.assign(contact, updateData);
      
      if (onUpdate) {
        onUpdate(contact._id, updateData);
      }

      setEditingField(null);
      console.log('✅ Campo atualizado:', editingField);
    } catch (error) {
      console.error('❌ Erro ao atualizar:', error);
      alert('Erro ao atualizar informação');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label: string, field: keyof Contact, icon: string) => {
    const value = contact?.[field] as string || '';
    const isEditing = editingField === field;

    return (
      <View style={styles.fieldContainer}>
        <View style={styles.fieldHeader}>
          <Ionicons name={icon as any} size={18} color="#6b7280" />
          <Text style={styles.fieldLabel}>{label}</Text>
        </View>
        
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus
              placeholder={label}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setEditingField(null)}
              >
                <Ionicons name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.fieldValue}
            onPress={() => handleEdit(field, value)}
          >
            <Text style={styles.valueText}>{value || 'Não informado'}</Text>
            <Ionicons name="create-outline" size={16} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!visible || !contact) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateX: slideAnim }] }
      ]}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Informações do Cliente</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Busca */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar na conversa..."
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

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'personal' && styles.tabActive]}
            onPress={() => setActiveTab('personal')}
          >
            <Text style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}>
              Dados Pessoais
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'address' && styles.tabActive]}
            onPress={() => setActiveTab('address')}
          >
            <Text style={[styles.tabText, activeTab === 'address' && styles.tabTextActive]}>
              Endereço
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          {activeTab === 'personal' ? (
            <View style={styles.section}>
              {renderField('Nome', 'name', 'person-outline')}
              {renderField('Telefone', 'phone', 'call-outline')}
              {renderField('Email', 'email', 'mail-outline')}
              {renderField('Empresa', 'company', 'business-outline')}
              {renderField('CPF', 'cpf', 'card-outline')}
              {renderField('CNPJ', 'cnpj', 'document-outline')}
              {renderField('Instagram', 'instagram_username', 'logo-instagram')}
              {renderField('Observações', 'notes', 'document-text-outline')}
            </View>
          ) : (
            <View style={styles.section}>
              {renderField('CEP', 'zipCode', 'location-outline')}
              {renderField('Rua', 'street', 'home-outline')}
              {renderField('Número', 'number', 'keypad-outline')}
              {renderField('Complemento', 'complement', 'information-circle-outline')}
              {renderField('Bairro', 'neighborhood', 'map-outline')}
              {renderField('Cidade', 'city', 'business-outline')}
              {renderField('Estado', 'state', 'flag-outline')}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: width,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#6366f1',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  fieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  valueText: {
    fontSize: 15,
    color: '#1f2937',
    flex: 1,
  },
  editContainer: {
    gap: 8,
  },
  editInput: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6366f1',
    fontSize: 15,
    color: '#1f2937',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  cancelButton: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
});
