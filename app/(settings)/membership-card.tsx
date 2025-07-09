import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const generateQRCodeUrl = (data: string, size = 200, color = '000000', bgcolor = 'FFFFFF') => {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodedData}&size=${size}x${size}&color=${color.replace('#', '')}&bgcolor=${bgcolor.replace('#', '')}`;
};

export default function MembershipCardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  const membershipId = user?.user_metadata?.membership_id || user?.id || 'guest';
  const qrValue = `SEATNDINE:MEMBER:${membershipId}`;

  const handleBackPress = () => {
    router.push('/(tabs)/settings');
  };

  useEffect(() => {
    if (user) {
      const textColor = isDarkMode ? 'FFFFFF' : '000000';
      const bgColor = isDarkMode ? theme.colors.card.replace('#', '') : 'FFFFFF';
      setQrCodeUrl(generateQRCodeUrl(qrValue, 250, textColor, bgColor));
    }
  }, [user, membershipId, isDarkMode]);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === 'granted');
    })();
  }, []);

  const saveQRToGallery = async () => {
    if (!hasMediaPermission) {
      Alert.alert(
        "Permisiune necesară", 
        "Avem nevoie de permisiune pentru a salva codul QR în galerie.", 
        [{ text: "OK" }]
      );
      return;
    }

    if (!qrCodeUrl) return;

    try {
      setIsLoading(true);
      
      const fileName = `seatndine-member-${membershipId}-${Date.now()}.png`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const { uri } = await FileSystem.downloadAsync(qrCodeUrl, fileUri);
      
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('SeatnDine', asset, false);
      
      Alert.alert("Succes", "Codul QR a fost salvat în galerie!");
      
    } catch (error) {
      console.error("Eroare la salvarea codului QR:", error);
      Alert.alert("Eroare", "Nu am putut salva codul QR. Vă rugăm să încercați din nou.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Card de Membru</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.cardContainer, { backgroundColor: theme.colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>SeatnDine</Text>
          <Text style={[styles.membershipText, { color: theme.colors.text }]}>Membru Premium</Text>
        </View>

        <View style={styles.qrContainer}>
          {qrCodeUrl ? (
            <Image
              source={{ uri: qrCodeUrl }}
              style={styles.qrCode}
              resizeMode="contain"
            />
          ) : (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilizator'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.placeholder }]}>
            {user?.email || 'email@example.com'}
          </Text>
          <Text style={[styles.membershipId, { color: theme.colors.placeholder }]}>
            ID: {membershipId}
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>Informații Card Membru</Text>
        <Text style={[styles.infoText, { color: theme.colors.placeholder }]}>
          Utilizați acest card pentru a vă identifica rapid la restaurantele partenere. 
          Prezentați codul QR la sosire pentru a beneficia de avantajele de membru.
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, { backgroundColor: theme.colors.primary, opacity: isLoading ? 0.7 : 1 }]}
        onPress={saveQRToGallery}
        disabled={isLoading || !qrCodeUrl}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Text style={styles.saveButtonText}>Salvează în Galerie</Text>
          </>
        )}
      </TouchableOpacity>
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
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardContainer: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  membershipText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    minHeight: 200,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  membershipId: {
    fontSize: 12,
  },
  infoSection: {
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 