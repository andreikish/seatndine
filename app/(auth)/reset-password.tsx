import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { lightTheme, darkTheme } from '../config/theme';
import { FadeIn } from '@/components/animated/FadeIn';
import { AnimatedPage } from '@/components/animated';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const params = useLocalSearchParams();

  useEffect(() => {
    if (!params.token) {
      router.replace('/(auth)/sign-in');
    }
  }, [params.token]);

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setError('Parolele nu coincid');
      return;
    }

    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Succes',
        'Parola a fost resetată cu succes!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/sign-in')
          }
        ]
      );
    } catch (err) {
      setError('A apărut o eroare la resetarea parolei. Vă rugăm să încercați din nou.');
    } finally {
      setIsLoading(false);
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
            <Text style={[styles.title, { color: theme.colors.text }]}>Resetare parolă</Text>
            <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>
              Introduceți noua parolă și confirmați-o pentru a finaliza procesul de resetare.
            </Text>
            {error ? <Text style={[styles.error, { color: theme.colors.notification }]}>{error}</Text> : null}
          </FadeIn>
          
          <FadeIn delay={300} from="bottom" distance={20}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Parolă nouă</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                placeholder="Introduceți noua parolă"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
          </FadeIn>

          <FadeIn delay={400} from="bottom" distance={20}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Confirmă parola</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                placeholder="Confirmați noua parolă"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
          </FadeIn>
          
          <FadeIn delay={500} from="bottom" distance={20}>
            <TouchableOpacity 
              style={[styles.resetBtn, { backgroundColor: theme.colors.primary }]} 
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={[styles.resetText, { color: theme.colors.card }]}>
                {isLoading ? 'Se procesează...' : 'Resetează parola'}
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
}); 