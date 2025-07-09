import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';

const FAQ_ITEMS = [
  {
    id: '1',
    question: 'Cum pot face o rezervare?',
    answer: 'Pentru a face o rezervare, selectează restaurantul dorit, alege data și ora, precum și numărul de persoane. Poți apoi să confirmi rezervarea și vei primi un email de confirmare.',
  },
  {
    id: '2',
    question: 'Pot modifica sau anula rezervarea?',
    answer: 'Da, poți modifica sau anula rezervarea până la 2 ore înainte de ora programată. Mergi la secțiunea de rezervări din aplicație și selectează rezervarea pe care dorești să o modifici sau să o anulezi.',
  },
  {
    id: '3',
    question: 'Cum câștig puncte de loialitate?',
    answer: 'Câștigi puncte de loialitate pentru fiecare rezervare pe care o faci și o finalizezi. Punctele pot fi folosite pentru reduceri la rezervările viitoare.',
  },
  {
    id: '4',
    question: 'Ce metode de plată sunt acceptate?',
    answer: 'Acceptăm toate cardurile de credit majore, Apple Pay și Google Pay. Unele restaurante pot accepta și plăți în numerar.',
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
          <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Centru de Ajutor</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Întrebări Frecvente</Text>
          {FAQ_ITEMS.map((item) => (
            <View key={item.id} style={[styles.faqItem, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.question, { color: theme.colors.text }]}>{item.question}</Text>
              <Text style={[styles.answer, { color: theme.colors.secondary }]}>{item.answer}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mai ai nevoie de ajutor?</Text>
          <TouchableOpacity 
            style={[styles.contactButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/contact-us')}
          >
            <IconSymbol name="message.fill" size={24} color="#fff" />
            <Text style={styles.contactButtonText}>Contactează Suportul</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 