import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReservations } from '@/contexts/ReservationContext';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RestaurantService } from '@/services/RestaurantService';
import { ReviewService } from '@/services/ReviewService';
import type { Restaurant } from '@/types/restaurant';

export default function ReservationScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { reservations, loading: reservationsLoading, updateReservation } = useReservations();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [checkingReview, setCheckingReview] = useState(true);

  const theme = isDarkMode ? darkTheme : lightTheme;

  const reservation = reservations.find(r => r.id === id);

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const reservation = reservations.find(r => r.id === id);
        if (!reservation) {
          setError('Rezervarea nu a fost găsită');
          return;
        }

        const restaurantData = await RestaurantService.getRestaurantById(reservation.restaurantId);
        if (!restaurantData) {
          setError('Restaurantul nu a fost găsit');
          return;
        }

        setRestaurant(restaurantData);
      } catch (err) {
        setError('Eroare la încărcarea datelor');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, [id, reservations]);

  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (!reservation) return setCanReview(false);
      if (reservation.status !== 'confirmed' && reservation.status !== 'completed') return setCanReview(false);
      if (reservation.status === 'confirmed') {
        const now = new Date();
        const endTime = new Date(reservation.reservationTime);
        endTime.setHours(endTime.getHours() + 2);
        if (now < endTime) return setCanReview(false);
      }
      try {
        const reviews = await ReviewService.getReviewsForRestaurant(reservation.restaurantId);
        const alreadyReviewed = reviews.some(r => r.reservation_id === reservation.id);
        setCanReview(!alreadyReviewed);
      } catch {
        setCanReview(false);
      } finally {
        setCheckingReview(false);
      }
    };
    checkReviewEligibility();
  }, [reservation]);

  if (reservationsLoading || loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Se încarcă...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
      </View>
    );
  }

  if (!reservation || !restaurant) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>Rezervarea nu a fost găsită</Text>
      </View>
    );
  }

  const [date, setDate] = useState(new Date(reservation.reservationTime));
  const [time, setTime] = useState(new Date(reservation.reservationTime));
  const [guests, setGuests] = useState(reservation.guests.toString());
  const [notes, setNotes] = useState(reservation.specialRequests || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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

  const handleUpdateReservation = async () => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(time.getHours()).padStart(2, '0');
      const minute = String(time.getMinutes()).padStart(2, '0');
      const reservationTime = new Date(`${year}-${month}-${day}T${hour}:${minute}:00+03:00`).toISOString();
      await updateReservation(id as string, {
        reservationTime,
        guests: parseInt(guests),
        specialRequests: notes
      });
      Alert.alert('Succes', 'Rezervarea a fost actualizată');
      router.back();
    } catch (err) {
      Alert.alert('Eroare', 'Nu s-a putut actualiza rezervarea');
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Actualizează rezervarea</Text>
        </View>

        <View style={styles.restaurantInfo}>
          <Text style={[styles.restaurantName, { color: theme.colors.text }]}>{restaurant.name}</Text>
          <Text style={[styles.restaurantCuisine, { color: theme.colors.text }]}>{restaurant.cuisine}</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={[styles.input, { backgroundColor: theme.colors.card }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.inputText, { color: theme.colors.text }]}>
              {date.toLocaleDateString('ro-RO')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.input, { backgroundColor: theme.colors.card }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={[styles.inputText, { color: theme.colors.text }]}>
              {time.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            value={guests}
            onChangeText={setGuests}
            keyboardType="numeric"
            placeholder="Număr persoane"
            placeholderTextColor={theme.colors.placeholder}
          />

          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Cereri speciale"
            placeholderTextColor={theme.colors.placeholder}
            multiline
          />

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleUpdateReservation}
          >
            <Text style={styles.buttonText}>Actualizează rezervarea</Text>
          </TouchableOpacity>

          {canReview && !checkingReview && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.push(`/reservation/${reservation.id}/review`)}
            >
              <Text style={styles.buttonText}>Lasă recenzie</Text>
            </TouchableOpacity>
          )}
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  restaurantCuisine: {
    fontSize: 16,
    marginTop: 8,
  },
  form: {
    padding: 16,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    color: 'red',
  },
}); 