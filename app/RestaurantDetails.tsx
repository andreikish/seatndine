import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Restaurant } from '@/types';
import { useSearch } from '../contexts/SearchContext';
import { RestaurantService } from '../services/RestaurantService';
import { useEffect, useState } from 'react';

export default function RestaurantDetails() {
  const { restaurant } = useLocalSearchParams();
  const restaurantData: Restaurant = JSON.parse(decodeURIComponent(restaurant as string));
  const { selectedDate, selectedTime, selectedPeople } = useSearch();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      setChecking(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const timeStr = selectedTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const available = await RestaurantService.getRestaurantAvailability(
        restaurantData.id,
        dateStr,
        timeStr,
        selectedPeople
      );
      setIsAvailable(available);
      setChecking(false);
    };
    checkAvailability();
  }, [restaurantData.id, selectedDate, selectedTime, selectedPeople]);

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: restaurantData.image }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.name}>{restaurantData.name}</Text>
        <Text style={styles.description}>{restaurantData.description}</Text>
        <Text style={styles.address}>Adresa: {restaurantData.address}</Text>
        <Text style={styles.rating}>Rating: {restaurantData.rating}/5</Text>
        {checking ? (
          <Text style={{ marginTop: 12, color: 'orange', fontWeight: 'bold' }}>Se verifică disponibilitatea...</Text>
        ) : isAvailable !== null && (
          <Text style={{ marginTop: 12, color: isAvailable ? 'green' : 'red', fontWeight: 'bold' }}>
            {isAvailable
              ? `Disponibil pentru ${selectedPeople} ${selectedPeople === 1 ? 'persoană' : 'persoane'} la ${selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} pe ${selectedDate.toLocaleDateString('ro-RO')}`
              : `Nu este disponibil pentru ${selectedPeople} ${selectedPeople === 1 ? 'persoană' : 'persoane'} la ${selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} pe ${selectedDate.toLocaleDateString('ro-RO')}`}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  address: {
    fontSize: 16,
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 