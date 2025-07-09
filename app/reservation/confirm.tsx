import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useReservations } from '../../contexts/ReservationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { RestaurantService } from '../../services/RestaurantService';
import { Restaurant } from '../../types/restaurant';
import { LinearGradient } from 'expo-linear-gradient';
import { ReviewService } from '@/services/ReviewService';

type LocationPreference = 'interior' | 'exterior' | 'any';

export default function ConfirmReservationScreen() {
  const { isDarkMode, colors } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { restaurantId, date: searchDate, time: searchTime, guests: searchGuests } = useLocalSearchParams();
  const { addReservation } = useReservations();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [date, setDate] = useState(searchDate ? new Date(searchDate as string) : new Date());
  const [time, setTime] = useState(searchTime ? new Date(searchTime as string) : new Date());
  const [guests, setGuests] = useState(searchGuests ? searchGuests as string : '2');
  const [locationPreference, setLocationPreference] = useState<LocationPreference>('any');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!restaurantId) return;
      try {
        const restaurantData = await RestaurantService.getRestaurantById(restaurantId as string);
        setRestaurant(restaurantData);
        const reviews = await ReviewService.getReviewsForRestaurant(restaurantId as string);
        if (reviews.length > 0) {
          const avg = reviews.reduce((acc, r) => acc + (r.general_rating || 0), 0) / reviews.length;
          setAvgRating(Number(avg.toFixed(1)));
        } else {
          setAvgRating(null);
        }
      } catch (error) {
        Alert.alert('Eroare', 'Nu s-a putut încărca informațiile restaurantului.');
      }
    };
    loadRestaurant();
  }, [restaurantId]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const handleConfirmReservation = async () => {
    if (!user || !restaurant) return;
    try {
      const reservationDateTime = new Date(date);
      reservationDateTime.setHours(time.getHours());
      reservationDateTime.setMinutes(time.getMinutes());

      console.log(`Creez rezervare cu data și ora: ${reservationDateTime.toISOString()}`);

      await addReservation({
        userId: user.id,
        restaurantId: restaurantId as string,
        restaurantName: restaurant.name,
        restaurantImage: restaurant.image,
        reservationTime: reservationDateTime.toISOString(),
        guests: parseInt(guests),
        status: 'confirmed',
        specialRequests: '',
        preferredLocation: locationPreference !== 'any' ? locationPreference : undefined
      });

      Alert.alert('Succes', 'Rezervarea a fost creată și confirmată cu succes! Vei primi notificări pentru această rezervare.');
      router.back();
    } catch (error) {
      Alert.alert('Eroare', 'A apărut o eroare la crearea rezervării.');
      console.error('Eroare rezervare:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Confirmă rezervarea</Text>
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: theme.colors.background }]}>
        {restaurant && (
          <View style={[styles.restaurantInfo, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
            <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
            <View style={styles.restaurantDetails}>
              <Text style={[styles.restaurantName, { color: theme.colors.text }]}>{restaurant.name}</Text>
              <View style={styles.restaurantMeta}>
                <View style={styles.metaItem}>
                  <IconSymbol name="map.fill" size={16} color="#FF6B00" />
                  <Text style={[styles.metaText, { color: theme.colors.text }]}>{restaurant.address}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaText, { color: theme.colors.text }]}>{avgRating !== null ? avgRating : 'N/A'}</Text>
                  <IconSymbol name="star.fill" size={16} color="#FF6B00" />
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.form, { backgroundColor: theme.colors.background }]}>
          <View style={styles.inputContainer}>
            <IconSymbol name="calendar" size={20} color="#FF6B00" style={styles.inputIcon} />
            <TouchableOpacity
              style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.inputText, { color: theme.colors.text }]}>
                {date.toLocaleDateString('ro-RO')}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              themeVariant={isDarkMode ? 'dark' : 'light'}
            />
          )}

          <View style={styles.inputContainer}>
            <IconSymbol name="clock" size={20} color="#FF6B00" style={styles.inputIcon} />
            <TouchableOpacity
              style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.inputText, { color: theme.colors.text }]}>
                {time.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={handleTimeChange}
              themeVariant={isDarkMode ? 'dark' : 'light'}
            />
          )}

          <View style={styles.inputContainer}>
            <IconSymbol name="person.2.fill" size={20} color="#FF6B00" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.primary }]}
              value={guests}
              onChangeText={setGuests}
              keyboardType="numeric"
              placeholder="Număr persoane"
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>

          <View style={styles.locationSelectorContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preferință locație masă:</Text>
            <View style={styles.locationOptions}>
              <TouchableOpacity 
                style={[
                  styles.locationOption, 
                  locationPreference === 'any' && [styles.selectedOption, { borderColor: theme.colors.primary }]
                ]}
                onPress={() => setLocationPreference('any')}
              >
                <Text style={[
                  styles.locationOptionText, 
                  { color: locationPreference === 'any' ? theme.colors.primary : theme.colors.text }
                ]}>
                  Nu contează
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.locationOption, 
                  locationPreference === 'interior' && [styles.selectedOption, { borderColor: theme.colors.primary }]
                ]}
                onPress={() => setLocationPreference('interior')}
              >
                <Text style={[
                  styles.locationOptionText, 
                  { color: locationPreference === 'interior' ? theme.colors.primary : theme.colors.text }
                ]}>
                  Interior
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.locationOption, 
                  locationPreference === 'exterior' && [styles.selectedOption, { borderColor: theme.colors.primary }]
                ]}
                onPress={() => setLocationPreference('exterior')}
              >
                <Text style={[
                  styles.locationOptionText, 
                  { color: locationPreference === 'exterior' ? theme.colors.primary : theme.colors.text }
                ]}>
                  Exterior
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleConfirmReservation}
          >
            <LinearGradient
              colors={['#FF6B00', '#FF8C00']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Confirmă rezervarea</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  restaurantInfo: {
    padding: 16,
    borderBottomWidth: 1,
  },
  restaurantImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  restaurantDetails: {
    gap: 8,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  restaurantMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
  },
  form: {
    padding: 16,
    gap: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputIcon: {
    width: 24,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputText: {
    fontSize: 16,
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  locationSelectorContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  locationOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignItems: 'center',
  },
  selectedOption: {
    borderWidth: 2,
  },
  locationOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 