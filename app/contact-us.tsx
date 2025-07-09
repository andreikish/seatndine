import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';

export default function ContactUsScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleSubmit = () => {
    if (!name || !email || !subject || !message) {
      Alert.alert('Eroare', 'Te rugăm să completezi toate câmpurile');
      return;
    }

    Alert.alert('Succes', 'Mesajul tău a fost trimis cu succes');
    router.push('/(tabs)/settings');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+40123456789');
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@seatndine.ro');
  };

  const handleAddressPress = () => {
    const address = 'Strada Restaurantelor 123, Cluj-Napoca';
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
          <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Contactează-ne</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Trimite-ne un mesaj</Text>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Nume</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border 
                }]}
                value={name}
                onChangeText={setName}
                placeholder="Numele tău"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border 
                }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Email-ul tău"
                placeholderTextColor={theme.colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Subiect</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border 
                }]}
                value={subject}
                onChangeText={setSubject}
                placeholder="Subiectul mesajului"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Mesaj</Text>
              <TextInput
                style={[styles.input, styles.messageInput, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border 
                }]}
                value={message}
                onChangeText={setMessage}
                placeholder="Mesajul tău"
                placeholderTextColor={theme.colors.placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.colors.primary }]} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Trimite Mesaj</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Alte modalități de contact</Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={handlePhonePress}>
            <IconSymbol name="phone.fill" size={24} color={theme.colors.primary} />
            <View style={styles.contactText}>
              <Text style={[styles.contactTitle, { color: theme.colors.text }]}>Telefon</Text>
              <Text style={[styles.contactValue, { color: theme.colors.primary }]}>+40 123 456 789</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
            <IconSymbol name="message.fill" size={24} color={theme.colors.primary} />
            <View style={styles.contactText}>
              <Text style={[styles.contactTitle, { color: theme.colors.text }]}>Email</Text>
              <Text style={[styles.contactValue, { color: theme.colors.primary }]}>support@seatndine.ro</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleAddressPress}>
            <IconSymbol name="map.fill" size={24} color={theme.colors.primary} />
            <View style={styles.contactText}>
              <Text style={[styles.contactTitle, { color: theme.colors.text }]}>Adresă</Text>
              <Text style={[styles.contactValue, { color: theme.colors.primary }]}>Strada Restaurantelor 123, București</Text>
            </View>
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
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  messageInput: {
    height: 120,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactText: {
    gap: 4,
  },
  contactTitle: {
    fontSize: 14,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 