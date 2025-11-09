import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function KanbanScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="grid-outline" size={80} color="#8b5cf6" />
        <Text style={styles.title}>Kanban</Text>
        <Text style={styles.subtitle}>
          Em desenvolvimento...
        </Text>
        <Text style={styles.description}>
          Aqui você terá acesso ao quadro Kanban com suas tarefas e projetos.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8b5cf6',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
