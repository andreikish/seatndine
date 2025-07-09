import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';

const PRIVACY_POLICY = [
  {
    title: 'Introducere',
    content: 'La Seat\'nDine, luăm confidențialitatea ta în serios. Această Politică de Confidențialitate explică cum colectăm, folosim, dezvăluim și protejăm informațiile tale când folosești aplicația noastră mobilă.',
  },
  {
    title: 'Informații pe care le colectăm',
    content: 'Colectăm informații pe care ni le furnizezi direct, inclusiv:\n\n• Nume și informații de contact\n• Adresă de email\n• Număr de telefon\n• Informații de plată\n• Preferințe pentru restaurante\n• Istoricul rezervărilor\n\nDe asemenea, colectăm automat anumite informații despre dispozitivul tău, inclusiv adresa IP, tipul de dispozitiv și sistemul de operare.',
  },
  {
    title: 'Cum folosim informațiile tale',
    content: 'Folosim informațiile colectate pentru a:\n\n• Oferi și menține serviciile noastre\n• Procesa rezervările tale\n• Trimite actualizări și notificări importante\n• Îmbunătăți aplicația și serviciile noastre\n• Personaliza experiența ta\n• Comunica cu tine despre promoții și oferte',
  },
  {
    title: 'Partajarea informațiilor',
    content: 'Nu vindem informațiile tale personale. Putem partaja informațiile tale cu:\n\n• Restaurantele unde faci rezervări\n• Procesatorii de plăți\n• Furnizorii de servicii care ne ajută să operăm aplicația\n• Forțele de ordine când este cerut de lege',
  },
  {
    title: 'Securitatea datelor',
    content: 'Implementăm măsuri de securitate adecvate pentru a proteja informațiile tale personale. Cu toate acestea, nici o metodă de transmisie pe internet sau de stocare electronică nu este 100% sigură.',
  },
  {
    title: 'Drepturile tale',
    content: 'Ai dreptul de a:\n\n• Accesa informațiile tale personale\n• Corecta informațiile inexacte\n• Cere ștergerea informațiilor tale\n• Te dezabona de la comunicările de marketing\n• Retrage consimțământul pentru procesarea datelor',
  },
  {
    title: 'Modificări ale acestei politici',
    content: 'Putem actualiza această Politică de Confidențialitate din când în când. Te vom notifica despre orice modificare prin publicarea noii Politici de Confidențialitate pe această pagină.',
  },
  {
    title: 'Contact',
    content: 'Dacă ai întrebări despre această Politică de Confidențialitate, te rugăm să ne contactezi la:\n\nEmail: privacy@seatndine.ro\nTelefon: +40 123 456 789',
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
          <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Politica de Confidențialitate</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.lastUpdated, { color: theme.colors.secondary }]}>Ultima actualizare: 16 aprilie 2024</Text>
          
          {PRIVACY_POLICY.map((section, index) => (
            <View key={index} style={[styles.policySection, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{section.title}</Text>
              <Text style={[styles.sectionContent, { color: theme.colors.secondary }]}>{section.content}</Text>
            </View>
          ))}
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
  lastUpdated: {
    fontSize: 14,
    marginBottom: 24,
  },
  policySection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 