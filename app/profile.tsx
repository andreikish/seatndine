import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView, Alert, Platform, Switch, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import * as ImagePicker from 'expo-image-picker';
import { router, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { AnimatedPage, FadeIn } from '@/components/animated';

export default function ProfileScreen() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, updateUserProfile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('Română');
  const [profilePicture, setProfilePicture] = useState(user?.user_metadata?.avatar_url || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.user_metadata?.full_name || '');
  const router = useRouter();

  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleBackPress = () => {
    router.back();
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisiune necesară', 'Avem nevoie de acces la galerie pentru a selecta o imagine.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setIsLoading(true);
        try {
          const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const fileName = `avatar-${user?.id}-${Date.now()}.jpg`;
          const filePath = `avatars/${fileName}`;

          const { error: uploadError, data } = await supabase.storage
            .from('avatars')
            .upload(filePath, decode(base64), {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (uploadError) {
            throw new Error(`Eroare la încărcarea imaginii: ${uploadError.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          const { data: userData, error: updateError } = await supabase.auth.updateUser({
            data: { 
              ...user?.user_metadata,
              avatar_url: publicUrl 
            }
          });

          if (updateError) {
            throw new Error(`Eroare la actualizarea profilului: ${updateError.message}`);
          }

          if (userData.user) {
            await updateUserProfile(userData.user.user_metadata);
          }
          Alert.alert('Succes', 'Poza de profil a fost actualizată cu succes!');
          setProfilePicture(publicUrl);
        } catch (error) {
          console.error('Eroare:', error);
          Alert.alert('Eroare', error instanceof Error ? error.message : 'A apărut o eroare la încărcarea imaginii.');
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Eroare la accesarea galeriei:', error);
      Alert.alert('Eroare', 'A apărut o eroare la accesarea galeriei de imagini.');
      setIsLoading(false);
    }
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const getImageUrl = useCallback((url: string | null | undefined) => {
    if (!url) return 'https://via.placeholder.com/100';
    
    if (Platform.OS === 'android' && url.startsWith('http:')) {
      url = url.replace('http:', 'https:');
    }

    return Platform.OS === 'android' 
      ? `${url}?timestamp=${Date.now()}` 
      : url;
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)');
    } catch (error) {
      console.error('Eroare la deconectare:', error);
      Alert.alert('Eroare', 'Nu s-a putut deconecta. Încearcă din nou.');
    }
  };

  const convertFileUri = useCallback((url: string) => {
    return Platform.OS === 'android'
      ? url
      : url.replace('file://', '');
  }, []);

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      Alert.alert('Eroare', 'Numele nu poate fi gol');
      return;
    }

    setIsLoading(true);
    try {
      const { data: userData, error: updateError } = await supabase.auth.updateUser({
        data: { 
          ...user?.user_metadata,
          full_name: newName.trim()
        }
      });

      if (updateError) {
        throw new Error(`Eroare la actualizarea numelui: ${updateError.message}`);
      }

      if (userData.user) {
        await updateUserProfile(userData.user.user_metadata);
        Alert.alert('Succes', 'Numele a fost actualizat cu succes!');
        setIsEditingName(false);
      }
    } catch (error) {
      console.error('Eroare:', error);
      Alert.alert('Eroare', error instanceof Error ? error.message : 'A apărut o eroare la actualizarea numelui.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedPage type="slideInRight" duration={400}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <FadeIn delay={100} from="top">
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
              >
                <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.colors.text }]}>Profil</Text>
              <View style={{ width: 24 }} />
            </View>
          </FadeIn>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <FadeIn delay={200} from="top">
              <View style={styles.profileHeader}>
                <TouchableOpacity
                  style={styles.profileImageContainer}
                  onPress={handleImagePick}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.card }]}>
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                      <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                        {(uploadProgress * 100).toFixed(0)}%
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Image
                        source={{ 
                          uri: getImageUrl(profilePicture),
                          cache: Platform.OS === 'ios' ? 'reload' : 'default'
                        }}
                        style={styles.profileImage}
                      />
                      <View style={[styles.editIconContainer, { backgroundColor: theme.colors.primary }]}>
                        <IconSymbol name="pencil" size={16} color="#FFFFFF" />
                      </View>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {user?.user_metadata?.full_name || 'User Name'}
                </Text>
                <Text style={[styles.userEmail, { color: theme.colors.placeholder }]}>
                  {user?.email || 'user@example.com'}
                </Text>
              </View>
            </FadeIn>

            <FadeIn delay={300} from="bottom">
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.placeholder }]}>Setări cont</Text>
                
                <View style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}>
                  <TouchableOpacity 
                    style={styles.menuLeft}
                    onPress={() => router.push('/language')}
                  >
                    <IconSymbol name="globe" size={24} color={theme.colors.primary} />
                    <Text style={[styles.menuText, { color: theme.colors.text }]}>Limbă</Text>
                  </TouchableOpacity>
                  <View style={styles.menuRight}>
                    <Text style={[styles.valueText, { color: theme.colors.secondaryText }]}>{language}</Text>
                    <IconSymbol name="chevron.right" size={20} color={theme.colors.secondaryText} />
                  </View>
                </View>

                <View style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}>
                  <TouchableOpacity 
                    style={styles.menuLeft}
                    onPress={() => router.push('/(auth)/change-email')}
                  >
                    <IconSymbol name="paperplane.fill" size={24} color={theme.colors.primary} />
                    <Text style={[styles.menuText, { color: theme.colors.text }]}>Schimbă email</Text>
                  </TouchableOpacity>
                  <View style={styles.menuRight}>
                    <IconSymbol name="chevron.right" size={20} color={theme.colors.secondaryText} />
                  </View>
                </View>

                <View style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.menuLeft}>
                    <IconSymbol name="moon.fill" size={24} color={theme.colors.primary} />
                    <Text style={[styles.menuText, { color: theme.colors.text }]}>Mod întunecat</Text>
                  </View>
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleTheme}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={theme.colors.card}
                  />
                </View>

                <View style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}>
                  <TouchableOpacity 
                    style={styles.menuLeft}
                    onPress={() => setIsEditingName(true)}
                  >
                    <IconSymbol name="person.2.fill" size={24} color={theme.colors.primary} />
                    <Text style={[styles.menuText, { color: theme.colors.text }]}>Editează numele</Text>
                  </TouchableOpacity>
                  <View style={styles.menuRight}>
                    <Text style={[styles.valueText, { color: theme.colors.secondaryText }]}>{user?.user_metadata?.full_name || 'Nume utilizator'}</Text>
                    <IconSymbol name="chevron.right" size={20} color={theme.colors.secondaryText} />
                  </View>
                </View>
              </View>
            </FadeIn>

            <FadeIn delay={400} from="bottom">
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.placeholder }]}>Suport</Text>
                
                <View style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}>
                  <TouchableOpacity 
                    style={styles.menuLeft}
                    onPress={() => router.push('/help-center')}
                  >
                    <IconSymbol name="questionmark.circle.fill" size={24} color={theme.colors.primary} />
                    <Text style={[styles.menuText, { color: theme.colors.text }]}>Centru de ajutor</Text>
                  </TouchableOpacity>
                  <View style={styles.menuRight}>
                    <IconSymbol name="chevron.right" size={20} color={theme.colors.secondaryText} />
                  </View>
                </View>

                <View style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}>
                  <TouchableOpacity 
                    style={styles.menuLeft}
                    onPress={() => router.push('/contact-us')}
                  >
                    <IconSymbol name="envelope.fill" size={24} color={theme.colors.primary} />
                    <Text style={[styles.menuText, { color: theme.colors.text }]}>Contactează-ne</Text>
                  </TouchableOpacity>
                  <View style={styles.menuRight}>
                    <IconSymbol name="chevron.right" size={20} color={theme.colors.secondaryText} />
                  </View>
                </View>

                <View style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}>
                  <TouchableOpacity 
                    style={styles.menuLeft}
                    onPress={() => router.push('/privacy-policy')}
                  >
                    <IconSymbol name="lock.fill" size={24} color={theme.colors.primary} />
                    <Text style={[styles.menuText, { color: theme.colors.text }]}>Politica de confidențialitate</Text>
                  </TouchableOpacity>
                  <View style={styles.menuRight}>
                    <IconSymbol name="chevron.right" size={20} color={theme.colors.secondaryText} />
                  </View>
                </View>
              </View>
            </FadeIn>

            <FadeIn delay={500} from="bottom">
              <TouchableOpacity
                style={[styles.signOutButton, { backgroundColor: theme.colors.error }]}
                onPress={handleSignOut}
              >
                <IconSymbol name="rectangle.portrait.and.arrow.right.fill" size={20} color="#FFFFFF" />
                <Text style={styles.signOutText}>Deconectare</Text>
              </TouchableOpacity>
            </FadeIn>
          </ScrollView>
        </View>
      </SafeAreaView>

      {isEditingName && (
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Editează numele</Text>
            <TextInput
              style={[styles.input, { 
                color: theme.colors.text,
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border
              }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Introdu numele tău"
              placeholderTextColor={theme.colors.placeholder}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                onPress={() => setIsEditingName(false)}
              >
                <Text style={styles.modalButtonText}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleUpdateName}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Salvează</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
  },
  valueText: {
    fontSize: 16,
    marginRight: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  } as const,
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  } as const,
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  } as const,
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  } as const,
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  } as const,
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  } as const,
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  } as const,
}); 