import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '../config/theme';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleSignUp = async () => {
    if (!fullName) {
      setError('Vă rugăm să introduceți numele dumneavoastră complet.');
      return;
    }
    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }
    try {
      setError('');
      await signUp(email, password);
      router.push('/(tabs)');
    } catch (err) {
      setError('Înregistrarea a eșuat. Vă rugăm să încercați din nou.');
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')}>
          <IconSymbol name="arrow.left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={[styles.logoCircle, { backgroundColor: theme.colors.card }]}>
          <IconSymbol name="person.2.fill" size={38} color={theme.colors.primary} />
        </View>
        <Text style={[styles.appTitle, { color: theme.colors.text }]}>Seat'nDine</Text>
        <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>Creează un cont nou</Text>
        
        {error ? <Text style={[styles.error, { color: theme.colors.notification }]}>{error}</Text> : null}
        
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Nume și prenume</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            placeholder="Introduceți numele dumneavoastră complet"
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Email</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            placeholder="Introduceți adresa dumneavoastră de email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Parola</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            placeholder="Creați o parolă"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.signUpBtn, { backgroundColor: theme.colors.primary }]} 
          onPress={handleSignUp}
        >
          <Text style={[styles.signUpText, { color: theme.colors.card }]}>Înregistrare</Text>
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
        
        <View style={styles.signInRow}>
          <Text style={[styles.signInText, { color: theme.colors.text }]}>Aveți deja un cont? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
            <Text style={[styles.signInLink, { color: theme.colors.primary }]}>Autentificare</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  backBtn: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
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
  signUpBtn: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signUpText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
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
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signInText: {
    fontSize: 14,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: 'bold',
  }
});
