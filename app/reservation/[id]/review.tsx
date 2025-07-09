import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewService } from '@/services/ReviewService';
import type { ReviewInput } from '@/types/review';
import { MaterialIcons } from '@expo/vector-icons';
import { useReservations } from '@/contexts/ReservationContext';

export default function ReservationReviewScreen() {
  const { id } = useLocalSearchParams(); // id rezervare
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { reservations } = useReservations();
  const theme = isDarkMode ? require('@/app/config/theme').darkTheme : require('@/app/config/theme').lightTheme;

  const reservation = reservations.find(r => r.id === id);
  if (!reservation) {
    return <View style={styles.center}><Text style={{ color: theme.colors.text }}>Rezervarea nu a fost găsită.</Text></View>;
  }

  const [generalRating, setGeneralRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [ambianceRating, setAmbianceRating] = useState(0);
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!generalRating || !serviceRating) {
      Alert.alert('Eroare', 'Completează toate notele obligatorii!');
      return;
    }
    setLoading(true);
    const review: ReviewInput = {
      user_id: isAnonymous ? null : user?.id ?? null,
      restaurant_id: reservation.restaurantId,
      reservation_id: reservation.id,
      is_anonymous: isAnonymous,
      general_rating: generalRating,
      service_rating: serviceRating,
      food_rating: foodRating || null,
      ambiance_rating: ambianceRating || null,
      text: text || null,
    };
    try {
      await ReviewService.addReview(review);
      Alert.alert('Succes', 'Recenzia a fost trimisă!');
      router.back();
    } catch (e) {
      Alert.alert('Eroare', 'Nu s-a putut trimite recenzia.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (value: number, onChange: (v: number) => void) => (
    <View style={{ flexDirection: 'row' }}>
      {Array(5).fill(0).map((_, i) => (
        <TouchableOpacity key={i} onPress={() => onChange(i + 1)}>
          <MaterialIcons
            name={i < value ? 'star' : 'star-border'}
            size={32}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ padding: 24 }}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Lasă o recenzie</Text>
      <Text style={[styles.label, { color: theme.colors.text }]}>Nota generală *</Text>
      {renderStars(generalRating, setGeneralRating)}
      <Text style={[styles.label, { color: theme.colors.text }]}>Cum a fost servirea? *</Text>
      {renderStars(serviceRating, setServiceRating)}
      <Text style={[styles.label, { color: theme.colors.text }]}>Cum a fost mâncarea?</Text>
      {renderStars(foodRating, setFoodRating)}
      <Text style={[styles.label, { color: theme.colors.text }]}>Cum a fost ambianța?</Text>
      {renderStars(ambianceRating, setAmbianceRating)}
      <Text style={[styles.label, { color: theme.colors.text }]}>Comentarii (opțional)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
        value={text}
        onChangeText={setText}
        placeholder="Scrie aici..."
        placeholderTextColor={theme.colors.text + '99'}
        multiline
        numberOfLines={4}
      />
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setIsAnonymous(v => !v)}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={isAnonymous ? 'check-box' : 'check-box-outline-blank'}
          size={24}
          color={theme.colors.primary}
        />
        <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>Trimite recenzia anonim</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary, opacity: loading ? 0.7 : 1 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Se trimite...' : 'Trimite recenzia'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    marginBottom: 16,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  button: {
    marginTop: 32,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 