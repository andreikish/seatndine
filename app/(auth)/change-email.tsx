import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { AnimatedPage, FadeIn } from '@/components/animated';
import { lightTheme, darkTheme } from '@/app/config/theme';

export default function ChangeEmailScreen() {
  const { isDarkMode } = useTheme();
  const { user, updateUserProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleBackPress = () => {
    router.back();
  };

  const handleChangeEmail = async () => {
    if (newEmail !== confirmEmail) {
      Alert.alert('Eroare', 'Adresele de email nu coincid.');
      return;
    }

    if (!newEmail.includes('@')) {
      Alert.alert('Eroare', 'Vă rugăm să introduceți o adresă de email validă.');
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `seatndine://auth/callback?type=email_change&email=${encodeURIComponent(newEmail)}`;
      console.log('[ChangeEmail] URL de redirecționare:', redirectUrl);

      const { data, error } = await supabase.auth.updateUser({
        email: newEmail
      }, {
        emailRedirectTo: redirectUrl
      });

      if (error) {
        console.error('[ChangeEmail] Eroare la actualizarea emailului:', error);
        throw error;
      }

      console.log('[ChangeEmail] Răspuns de la Supabase:', data);

      if (data.user) {
        await updateUserProfile({
          ...data.user.user_metadata,
          email: newEmail
        });
      }

      Alert.alert(
        'Succes',
        'Un email de confirmare a fost trimis la adresa dvs. de email curentă. Vă rugăm să verificați inbox-ul pentru a finaliza schimbarea.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Eroare', 'Nu s-a putut procesa cererea. Vă rugăm să încercați din nou.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedPage type="slideInRight" duration={400}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <FadeIn delay={100} from="top">
            <View style={[styles.header, { paddingTop: insets.top }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
              >
                <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.colors.text }]}>Schimbă email</Text>
              <View style={{ width: 24 }} />
            </View>
          </FadeIn>

          <FadeIn delay={200} from="bottom">
            <View style={styles.content}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Email curent: {user?.email}
              </Text>

              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                placeholder="Noul email"
                placeholderTextColor={theme.colors.placeholder}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                placeholder="Confirmă noul email"
                placeholderTextColor={theme.colors.placeholder}
                value={confirmEmail}
                onChangeText={setConfirmEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={handleChangeEmail}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Schimbă email</Text>
                )}
              </TouchableOpacity>
            </View>
          </FadeIn>
        </View>
      </SafeAreaView>
    </AnimatedPage>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 