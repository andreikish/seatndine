import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { router } from 'expo-router';

export default function EditProfileScreen() {
  const { isDarkMode } = useTheme();
  const { user, updateUserProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');

  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleBackPress = () => {
    router.back();
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateUserProfile({
        full_name: fullName,
        email: email
      });
      Alert.alert('Succes', 'Profilul a fost actualizat cu succes');
      router.back();
    } catch (error) {
      Alert.alert('Eroare', 'A apărut o eroare la actualizarea profilului');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <TouchableOpacity 
          onPress={handleBackPress} 
          style={[styles.backButton, { top: insets.top + 16 }]}
        >
          <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Editare Profil</Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Nume complet</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Introduceți numele complet"
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Introduceți email-ul"
              placeholderTextColor={theme.colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Se salvează...' : 'Salvează modificările'}
            </Text>
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
  scrollView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    padding: 8,
  },
  content: {
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 