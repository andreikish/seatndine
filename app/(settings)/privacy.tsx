import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = '@privacy_settings:';

export default function PrivacySettingsScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [locationPermission, setLocationPermission] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [personalizedAds, setPersonalizedAds] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [saveSearchHistory, setSaveSearchHistory] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const userId = user?.id || 'guest';
        
        const locationPerm = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}:location`);
        const notifEnabled = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}:notifications`);
        const dataSharingPref = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}:dataSharing`);
        const personAds = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}:personalizedAds`);
        const analytics = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}:analytics`);
        const searchHistory = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}:searchHistory`);
        
        if (locationPerm !== null) setLocationPermission(locationPerm === 'true');
        if (notifEnabled !== null) setNotificationsEnabled(notifEnabled === 'true');
        if (dataSharingPref !== null) setDataSharing(dataSharingPref === 'true');
        if (personAds !== null) setPersonalizedAds(personAds === 'true');
        if (analytics !== null) setAnalyticsEnabled(analytics === 'true');
        if (searchHistory !== null) setSaveSearchHistory(searchHistory === 'true');
      } catch (error) {
        console.error('Eroare la încărcarea setărilor de confidențialitate:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const saveSettingToStorage = async (key: string, value: boolean) => {
    try {
      const userId = user?.id || 'guest';
      await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}:${key}`, value.toString());
    } catch (error) {
      console.error(`Eroare la salvarea setării ${key}:`, error);
    }
  };

  const handleLocationPermissionChange = (value: boolean) => {
    setLocationPermission(value);
    saveSettingToStorage('location', value);
  };

  const handleNotificationsChange = (value: boolean) => {
    setNotificationsEnabled(value);
    saveSettingToStorage('notifications', value);
  };

  const handleDataSharingChange = (value: boolean) => {
    setDataSharing(value);
    saveSettingToStorage('dataSharing', value);
  };

  const handlePersonalizedAdsChange = (value: boolean) => {
    setPersonalizedAds(value);
    saveSettingToStorage('personalizedAds', value);
  };

  const handleAnalyticsChange = (value: boolean) => {
    setAnalyticsEnabled(value);
    saveSettingToStorage('analytics', value);
  };

  const handleSearchHistoryChange = (value: boolean) => {
    setSaveSearchHistory(value);
    saveSettingToStorage('searchHistory', value);
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Confirmare',
      'Ești sigur că vrei să ștergi toate datele tale personale? Această acțiune nu poate fi anulată.',
      [
        {
          text: 'Anulează',
          style: 'cancel',
        },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = user?.id || 'guest';
              const keys = [
                `${STORAGE_KEY_PREFIX}${userId}:location`,
                `${STORAGE_KEY_PREFIX}${userId}:notifications`,
                `${STORAGE_KEY_PREFIX}${userId}:dataSharing`,
                `${STORAGE_KEY_PREFIX}${userId}:personalizedAds`,
                `${STORAGE_KEY_PREFIX}${userId}:analytics`,
                `${STORAGE_KEY_PREFIX}${userId}:searchHistory`,
              ];
              
              await AsyncStorage.multiRemove(keys);
              
              setLocationPermission(true);
              setNotificationsEnabled(true);
              setDataSharing(false);
              setPersonalizedAds(true);
              setAnalyticsEnabled(true);
              setSaveSearchHistory(true);
              
              Alert.alert('Succes', 'Toate datele personale au fost șterse cu succes.');
            } catch (error) {
              console.error('Eroare la ștergerea datelor:', error);
              Alert.alert('Eroare', 'A apărut o eroare la ștergerea datelor. Încearcă din nou.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View 
        style={[styles.header, { 
          paddingTop: insets.top > 0 ? 0 : 16,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border
        }]}
      >
        <TouchableOpacity 
          onPress={handleBackPress} 
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Setări de confidențialitate</Text>
        <View style={{ width: 32 }}><Text></Text></View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText }]}>
            Gestionare permisiuni
          </Text>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Locație</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.secondaryText }]}>
                Permite aplicației să acceseze locația ta pentru a găsi restaurante în apropiere
              </Text>
            </View>
            <Switch
              value={locationPermission}
              onValueChange={handleLocationPermissionChange}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Notificări</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.secondaryText }]}>
                Primește alerte pentru rezervări, promoții și actualizări
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsChange}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText, marginTop: 24 }]}>
            Partajare date
          </Text>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Partajare date cu parteneri</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.secondaryText }]}>
                Permite partajarea datelor tale anonimizate cu restaurantele partenere
              </Text>
            </View>
            <Switch
              value={dataSharing}
              onValueChange={handleDataSharingChange}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Reclame personalizate</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.secondaryText }]}>
                Permite afișarea reclamelor personalizate pe baza preferințelor tale
              </Text>
            </View>
            <Switch
              value={personalizedAds}
              onValueChange={handlePersonalizedAdsChange}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText, marginTop: 24 }]}>
            Date de utilizare
          </Text>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Analytics</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.secondaryText }]}>
                Permite colectarea de date anonime pentru îmbunătățirea aplicației
              </Text>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={handleAnalyticsChange}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Salvare istoric căutări</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.secondaryText }]}>
                Salvează istoricul căutărilor pentru sugestii mai bune
              </Text>
            </View>
            <Switch
              value={saveSearchHistory}
              onValueChange={handleSearchHistoryChange}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.card, marginTop: 24 }]}
            onPress={() => router.push('/privacy-policy')}
          >
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>Vezi politica de confidențialitate</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.colors.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.error, marginTop: 16 }]}
            onPress={handleDeleteAllData}
          >
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Șterge toate datele</Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: theme.colors.secondaryText, marginTop: 24 }]}>
            Toate modificările din setările de confidențialitate sunt salvate automat. Pentru mai multe informații despre cum gestionăm datele tale, consultă Politica noastră de confidențialitate.
          </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
}); 