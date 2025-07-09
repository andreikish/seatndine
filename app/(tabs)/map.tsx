import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Modal, Image, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { defaultMapConfig } from '../config/maps';
import { useTheme } from '../../contexts/ThemeContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useRouter } from 'expo-router';
import { Restaurant } from '../types/restaurant';
import { useLocation } from '../../contexts/LocationContext';
import { RestaurantService } from '@/services/RestaurantService';
import { ReviewService } from '@/services/ReviewService';

export default function MapScreen() {
  const { colors } = useTheme();
  const { favorites } = useFavorites();
  const router = useRouter();
  const { location } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewAverages, setReviewAverages] = useState<{ [restaurantId: string]: number | null }>({});

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await RestaurantService.getAllRestaurants();
        setRestaurants(data);
        setFilteredRestaurants(data);
        
        const averages: { [restaurantId: string]: number | null } = {};
        await Promise.all(data.map(async (restaurant) => {
          const reviews = await ReviewService.getReviewsForRestaurant(restaurant.id);
          if (reviews.length > 0) {
            const avg = reviews.reduce((acc, r) => acc + (r.general_rating || 0), 0) / reviews.length;
            averages[restaurant.id] = Number(avg.toFixed(1));
          } else {
            averages[restaurant.id] = null;
          }
        }));
        setReviewAverages(averages);
      } catch (error) {
        console.error('Eroare la încărcarea restaurantelor:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = restaurants.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    } else {
      setFilteredRestaurants(restaurants);
    }
  }, [searchQuery, restaurants]);

  const handleMarkerPress = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleCloseModal = () => {
    setSelectedRestaurant(null);
  };

  const handleViewDetails = () => {
    if (selectedRestaurant) {
      router.push({
        pathname: '/restaurant/[id]',
        params: { id: selectedRestaurant.id }
      });
    }
  };

  const handleReserveTable = () => {
    if (selectedRestaurant) {
      router.push({
        pathname: '/reservation/confirm',
        params: { restaurantId: selectedRestaurant.id }
      });
    }
  };

  const renderStars = (value: number) => (
    <View style={{ flexDirection: 'row' }}>
      {Array(5).fill(0).map((_, i) => (
        <MaterialIcons
          key={i}
          name={i < value ? 'star' : 'star-border'}
          size={16}
          color={colors.primary}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Caută restaurante..."
          placeholderTextColor={colors.text}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <MapView
        style={styles.map}
        initialRegion={defaultMapConfig.initialRegion}
        showsUserLocation={true}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      >
        {filteredRestaurants.map((restaurant) => {
          try {
            const coordinates = typeof restaurant.coordinates === 'string' 
              ? JSON.parse(restaurant.coordinates)
              : restaurant.coordinates;
            
            return coordinates && coordinates.latitude && coordinates.longitude ? (
              <Marker
                key={restaurant.id}
                coordinate={{
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                }}
                title={restaurant.name}
                description={restaurant.cuisine}
                onPress={() => handleMarkerPress(restaurant)}
              >
                <View style={[styles.markerContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons name="restaurant" size={20} color="white" />
                </View>
              </Marker>
            ) : null;
          } catch (error) {
            console.error('Eroare la parsarea coordonatelor pentru:', restaurant.name, error);
            return null;
          }
        })}
      </MapView>

      <Modal
        visible={!!selectedRestaurant}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        {selectedRestaurant && (
          <TouchableOpacity 
            style={[styles.modalContainer]}
            activeOpacity={1}
            onPress={handleCloseModal}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={[styles.modalContentWrapper, { backgroundColor: colors.background }]}
            >
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <Image
                  source={{ uri: selectedRestaurant.image }}
                  style={styles.restaurantImage}
                />
                <View style={styles.restaurantInfo}>
                  <Text style={[styles.restaurantName, { color: colors.text }]}>
                    {selectedRestaurant.name}
                  </Text>
                  <View style={styles.ratingPriceContainer}>
                    <View style={styles.ratingContainer}>
                      {renderStars(Math.round(reviewAverages[selectedRestaurant.id] || 0))}
                      <Text style={[styles.restaurantRating, { color: colors.text }]}>
                        {reviewAverages[selectedRestaurant.id] !== undefined && reviewAverages[selectedRestaurant.id] !== null 
                          ? reviewAverages[selectedRestaurant.id] 
                          : 'N/A'}
                      </Text>
                    </View>
                    <Text style={[styles.restaurantPrice, { color: colors.text }]}>
                      {selectedRestaurant.priceRange}
                    </Text>
                  </View>
                  <Text style={[styles.restaurantCuisine, { color: colors.text }]}>
                    {selectedRestaurant.cuisine}
                  </Text>
                  <View style={styles.quickInfoContainer}>
                    <View style={styles.quickInfoRow}>
                      <Ionicons name="time-outline" size={16} color={colors.text} />
                      <Text style={[styles.quickInfoText, { color: colors.text }]}>
                        {selectedRestaurant.openingHours?.monday?.open 
                          ? `${selectedRestaurant.openingHours.monday.open} - ${selectedRestaurant.openingHours.monday.close}`
                          : 'Program indisponibil'}
                      </Text>
                    </View>
                    <View style={styles.quickInfoRow}>
                      <Ionicons name="location-outline" size={16} color={colors.text} />
                      <Text style={[styles.quickInfoText, { color: colors.text }]} numberOfLines={1}>
                        {selectedRestaurant.address}
                      </Text>
                    </View>
                    <View style={styles.quickInfoRow}>
                      <Text style={[styles.quickInfoText, { color: colors.text }]}>
                        {selectedRestaurant.features.slice(0, 2).join(', ')}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={handleReserveTable}
                  >
                    <Text style={styles.actionButtonText}>Rezervă Masă</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={handleViewDetails}
                  >
                    <Text style={styles.actionButtonText}>Vezi Detalii</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    zIndex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContentWrapper: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalContent: {
    padding: 15,
    maxHeight: '45%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  restaurantImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
  },
  restaurantInfo: {
    marginTop: 10,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  restaurantCuisine: {
    fontSize: 14,
    marginTop: 5,
  },
  restaurantRating: {
    fontSize: 14,
  },
  restaurantPrice: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  quickInfoContainer: {
    marginTop: 10,
  },
  quickInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  quickInfoText: {
    fontSize: 12,
    marginLeft: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
}); 