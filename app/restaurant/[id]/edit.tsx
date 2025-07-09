import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { RestaurantService } from '@/services/RestaurantService';
import { Restaurant } from '@/types/restaurant';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';
import { TableManager } from '@/components/TableManager';

export default function EditRestaurantScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine: '',
    address: '',
    phone: '',
    website: '',
    priceRange: '$$',
    status: 'Available',
    discount: '',
    meniuPdf: ''
  });

  const [tables, setTables] = useState<{
    interior: { id: string; seats: number; isAvailable: boolean }[];
    exterior: { id: string; seats: number; isAvailable: boolean }[];
  }>({
    interior: [],
    exterior: []
  });

  useEffect(() => {
    const checkAdminAndLoadRestaurant = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const isAdmin = await RestaurantService.isRestaurantAdmin(id as string);
        
        if (!isAdmin) {
          Alert.alert('Eroare', 'Nu aveți permisiunea de a edita acest restaurant');
          router.back();
          return;
        }

        const restaurantData = await RestaurantService.getRestaurantById(id as string);
        if (!restaurantData) {
          Alert.alert('Eroare', 'Restaurantul nu a fost găsit');
          router.back();
          return;
        }

        setRestaurant(restaurantData);
        setFormData({
          name: restaurantData.name,
          description: restaurantData.description,
          cuisine: restaurantData.cuisine,
          address: restaurantData.address,
          phone: restaurantData.phone,
          website: restaurantData.website || '',
          priceRange: restaurantData.priceRange,
          status: restaurantData.status,
          discount: restaurantData.discount || '',
          meniuPdf: restaurantData.menuPdf || ''
        });

        if (restaurantData.tables) {
          setTables({
            interior: restaurantData.tables.interior || [],
            exterior: restaurantData.tables.exterior || []
          });
        } else {
          setTables({
            interior: [],
            exterior: []
          });
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Eroare', 'A apărut o eroare la încărcarea datelor');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadRestaurant();
  }, [id]);

  const handleSubmit = async () => {
    if (!restaurant) return;
    
    try {
      setSaving(true);
      
      const refreshedRestaurantData = await RestaurantService.getRestaurantById(restaurant.id);
      
      if (!refreshedRestaurantData) {
        throw new Error('Nu s-au putut obține datele actualizate ale restaurantului');
      }
      
      const tablesUpdateResult = await supabase.rpc('update_restaurant_tables', {
        restaurant_id: String(restaurant.id),
        new_tables: tables
      });
      
      if (tablesUpdateResult.error) {
        console.error('Eroare la actualizarea meselor:', tablesUpdateResult.error);
        throw tablesUpdateResult.error;
      }
      
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: formData.name,
          description: formData.description,
          cuisine: formData.cuisine,
          address: formData.address,
          phone: formData.phone,
          website: formData.website,
          price_range: formData.priceRange,
          status: formData.status,
          discount: formData.discount,
          meniuPdf: formData.meniuPdf
        })
        .eq('id', restaurant.id);
      
      if (error) {
        throw error;
      }
      
      Alert.alert(
        'Succes',
        'Restaurantul a fost actualizat cu succes!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (err: any) {
      console.error('Eroare la actualizarea restaurantului:', err);
      Alert.alert(
        'Eroare',
        `Nu s-a putut actualiza restaurantul: ${err.message || err}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTablesUpdated = (updatedTables: {
    interior: { id: string; seats: number; isAvailable: boolean }[];
    exterior: { id: string; seats: number; isAvailable: boolean }[];
  }) => {
    setTables(updatedTables);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Se încarcă...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Editare Restaurant</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Nume</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Numele restaurantului"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Descriere</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Descrierea restaurantului"
            placeholderTextColor={theme.colors.placeholder}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Bucătărie</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            value={formData.cuisine}
            onChangeText={(text) => setFormData(prev => ({ ...prev, cuisine: text }))}
            placeholder="Tipul de bucătărie"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Adresă</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            value={formData.address}
            onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
            placeholder="Adresa restaurantului"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Telefon</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            placeholder="Număr de telefon"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Website</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            value={formData.website}
            onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
            placeholder="Website-ul restaurantului"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Categorie de preț</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            value={formData.priceRange}
            onChangeText={(text) => setFormData(prev => ({ ...prev, priceRange: text }))}
            placeholder="Categoria de preț (ex: $$)"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Status</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            value={formData.status}
            onChangeText={(text) => setFormData(prev => ({ ...prev, status: text }))}
            placeholder="Statusul restaurantului"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Discount</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            value={formData.discount}
            onChangeText={(text) => setFormData(prev => ({ ...prev, discount: text }))}
            placeholder="Discount activ (opțional)"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Meniu PDF</Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            value={formData.meniuPdf}
            onChangeText={(text) => setFormData(prev => ({ ...prev, meniuPdf: text }))}
            placeholder="URL-ul către PDF-ul meniului (opțional)"
            placeholderTextColor={theme.colors.placeholder}
          />
          
          <Text style={[{ color: theme.colors.text, marginTop: 8, fontSize: 12 }]}>
            Pentru a adăuga un meniu PDF, încărcați fișierul în Supabase Storage din panoul de administrare și copiați URL-ul aici.
          </Text>
        </View>

        <View style={[styles.tableManagerContainer, { backgroundColor: theme.colors.card }]}>
          <TableManager
            restaurantId={restaurant?.id || ''}
            initialTables={tables}
            onTablesUpdated={handleTablesUpdated}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Se salvează...' : 'Salvează modificările'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  tableManagerContainer: {
    borderRadius: 8,
    marginTop: 16,
    padding: 16,
  },
}); 