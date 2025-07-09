import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '../config/theme';
import { FadeIn } from '@/components/animated/FadeIn';
import { AnimatedPage } from '@/components/animated';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleSignIn = async () => {
    try {
      setError('');
      await signIn(email, password, rememberMe);
      router.push('/(tabs)');
    } catch (err) {
      setError('Login-ul a eșuat. Vă rugăm să verificați datele dumneavoastră.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err) {
      setError('Autentificarea Google a eșuat. Vă rugăm să încercați din nou.');
    }
  };

  return (
    <AnimatedPage type="fadeIn" duration={500}>
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <FadeIn delay={100} from="top" distance={30}>
            <View style={[styles.logoCircle, { backgroundColor: theme.colors.card }]}>
              <IconSymbol name="person.2.fill" size={38} color={theme.colors.primary} />
            </View>
          </FadeIn>
          
          <FadeIn delay={200} from="top" distance={20}>
            <Text style={[styles.appTitle, { color: theme.colors.text }]}>Seat'nDine</Text>
            <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>Rezervă la restaurantele tale preferate</Text>
            {error ? <Text style={[styles.error, { color: theme.colors.notification }]}>{error}</Text> : null}
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
              />
            </View>
          </FadeIn>
          
          <FadeIn delay={400} from="bottom" distance={20}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Parola</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                placeholder="Introduceți parola"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>
          </FadeIn>
          
          <FadeIn delay={500} from="bottom" distance={20}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setRememberMe(!rememberMe)}>
                  <View style={[styles.checkbox, { 
                    backgroundColor: rememberMe ? theme.colors.primary : theme.colors.card,
                    borderColor: theme.colors.border
                  }]} />
                </TouchableOpacity>
                <Text style={[styles.rememberMe, { color: theme.colors.text }]}> Reține-mă</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={[styles.forgot, { color: theme.colors.primary }]}>Ai uitat parola?</Text>
              </TouchableOpacity>
            </View>
          </FadeIn>
          
          <FadeIn delay={600} from="bottom" distance={20}>
            <TouchableOpacity 
              style={[styles.signInBtn, { backgroundColor: theme.colors.primary }]} 
              onPress={handleSignIn}
            >
              <Text style={[styles.signInText, { color: theme.colors.card }]}>Autentificare</Text>
            </TouchableOpacity>
            <Text style={[styles.orText, { color: theme.colors.placeholder }]}>sau continuați cu</Text>
            <View style={styles.socialRow}>
              <TouchableOpacity 
                style={[styles.socialBtn, { backgroundColor: theme.colors.card }]} 
                onPress={handleGoogleSignIn}
              >
                <Image source={require('../../assets/google.png')} style={styles.socialIcon} />
                <Text style={[styles.socialText, { color: theme.colors.text }]}>Google</Text>
              </TouchableOpacity>
            </View>
          </FadeIn>
          
          <FadeIn delay={700} from="bottom" distance={20}>
            <View style={styles.signupRow}>
              <Text style={[styles.signupText, { color: theme.colors.text }]}>Nu aveți un cont? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={[styles.signupLink, { color: theme.colors.primary }]}>Înregistrare</Text>
              </TouchableOpacity>
            </View>
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
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  rememberMe: {
    fontSize: 14,
  },
  forgot: {
    fontSize: 14,
  },
  signInBtn: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signInText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    marginBottom: 24,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 36,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  socialText: {
    fontSize: 16,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
