import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { lightTheme, darkTheme } from '../config/theme';
import { FadeIn } from '@/components/animated/FadeIn';
import { AnimatedPage } from '@/components/animated';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { resetPassword } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleResetPassword = async () => {
    try {
      setError('');
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError('A apărut o eroare. Vă rugăm să încercați din nou.');
    }
  };

  return (
    <AnimatedPage type="fadeIn" duration={500}>
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <FadeIn delay={100} from="top" distance={30}>
            <View style={[styles.logoCircle, { backgroundColor: theme.colors.card }]}>
              <IconSymbol name="lock.fill" size={38} color={theme.colors.primary} />
            </View>
          </FadeIn>
          
          <FadeIn delay={200} from="top" distance={20}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Ai uitat parola?</Text>
            <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>
              Introduceți adresa de email asociată contului dvs. și vă vom trimite instrucțiuni pentru resetarea parolei.
            </Text>
            {error ? <Text style={[styles.error, { color: theme.colors.notification }]}>{error}</Text> : null}
            {success ? (
              <Text style={[styles.success, { color: theme.colors.success }]}>
                Email-ul de resetare a fost trimis. Vă rugăm să verificați inbox-ul dvs.
              </Text>
            ) : null}
          </FadeIn>
          
          <FadeIn delay={300} from="bottom" distance={20}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                placeholder="Introduceți adresa de email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={theme.colors.placeholder}
                editable={!success}
              />
            </View>
          </FadeIn>
          
          <FadeIn delay={400} from="bottom" distance={20}>
            <TouchableOpacity 
              style={[styles.resetBtn, { backgroundColor: theme.colors.primary }]} 
              onPress={handleResetPassword}
              disabled={success}
            >
              <Text style={[styles.resetText, { color: theme.colors.card }]}>
                {success ? 'Email trimis' : 'Trimite email de resetare'}
              </Text>
            </TouchableOpacity>
          </FadeIn>
          
          <FadeIn delay={500} from="bottom" distance={20}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Text style={[styles.backText, { color: theme.colors.primary }]}>
                Înapoi la autentificare
              </Text>
            </TouchableOpacity>
          </FadeIn>
        </View>
      </SafeAreaView>
    </AnimatedPage>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 50,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  success: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  resetBtn: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 