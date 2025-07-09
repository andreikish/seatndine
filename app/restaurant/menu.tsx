import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RestaurantService } from '@/services/RestaurantService';

export default function MenuScreen() {
  const { menuUrl, restaurantName } = useLocalSearchParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const loadPdfUrl = async () => {
      setLoading(true);
      try {
        if (!menuUrl) {
          setError('URL-ul meniului lipsește');
          return;
        }

        console.log('menuUrl original:', menuUrl);
        
        if (typeof menuUrl === 'string' && (
          menuUrl.startsWith('menus/') || 
          !menuUrl.startsWith('http')
        )) {
          console.log('Se folosește Supabase Storage pentru URL:', menuUrl);
          const url = await RestaurantService.getMenuPdfUrl(menuUrl);
          console.log('URL obținut de la Supabase:', url);
          
          if (!url) {
            setError('Nu s-a putut obține URL-ul PDF-ului');
            return;
          }
          setPdfUrl(url);
        } else {
          console.log('Se folosește URL extern:', menuUrl);
          setPdfUrl(menuUrl.toString());
        }
      } catch (err) {
        console.error('Eroare la încărcarea PDF-ului:', err);
        setError('A apărut o eroare la încărcarea meniului');
      } finally {
        setLoading(false);
      }
    };

    loadPdfUrl();
  }, [menuUrl]);

  const handleOpenInBrowser = () => {
    if (pdfUrl) {
      Linking.openURL(pdfUrl);
    }
  };

  const getPdfViewerSource = () => {
    if (!pdfUrl) return { uri: 'about:blank' };
    
    if (Platform.OS === 'ios') {
      return { uri: pdfUrl };
    }
    
    return { 
      uri: `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true` 
    };
  };

  if (!menuUrl) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol
              name="chevron.left"
              size={28}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Meniu
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Meniul nu este disponibil.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            name="chevron.left"
            size={28}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {restaurantName ? `Meniu ${restaurantName}` : 'Meniu'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Se încarcă meniul...
          </Text>
        </View>
      )}

      {pdfUrl && !error && (
        <>
          <WebView
            source={getPdfViewerSource()}
            style={styles.webview}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('Eroare la încărcarea WebView:', nativeEvent);
              setError(nativeEvent.description || 'Eroare la încărcarea PDF-ului');
              setLoading(false);
            }}
          />
          
          <TouchableOpacity 
            style={[styles.openInBrowserButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleOpenInBrowser}
          >
            <Text style={styles.openInBrowserText}>
              Deschide în browser
            </Text>
          </TouchableOpacity>
        </>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            A apărut o eroare la încărcarea meniului: {error}
          </Text>
          
          {pdfUrl && (
            <TouchableOpacity 
              style={[styles.openInBrowserButton, { backgroundColor: theme.colors.primary, marginTop: 20 }]}
              onPress={handleOpenInBrowser}
            >
              <Text style={styles.openInBrowserText}>
                Deschide în browser extern
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  openInBrowserButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  openInBrowserText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 