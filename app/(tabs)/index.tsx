import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Platform, Modal, Animated, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router/build/hooks';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Restaurant } from '../../types/restaurant';
import { useAuth } from '../../contexts/AuthContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../config/theme';
import { FavoritesProvider, useFavorites } from '@/contexts/FavoritesContext';
import { Picker } from '@react-native-picker/picker';
import { RestaurantService } from '@/services/RestaurantService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSearch } from '@/contexts/SearchContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeIn } from '@/components/animated/FadeIn';
import { AnimatedPage } from '@/components/animated';
import { SkeletonRestaurantCard, SkeletonLoader } from '@/components/animated';
import { ReviewService } from '@/services/ReviewService';
import debounce from 'lodash/debounce';

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite } = useFavorites();
  const { selectedDate, selectedTime, selectedPeople, setSelectedDate, setSelectedTime, setSelectedPeople } = useSearch();
  const [selectedCuisine, setSelectedCuisine] = useState('Toate');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPeoplePicker, setShowPeoplePicker] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [elementsLoaded, setElementsLoaded] = useState({
    recommended: false,
    restaurants: false
  });
  const [reviewAverages, setReviewAverages] = useState<{ [restaurantId: string]: number | null }>({});
  const [availableRestaurants, setAvailableRestaurants] = useState<Set<string>>(new Set());
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityCache, setAvailabilityCache] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [showMinutePicker, setShowMinutePicker] = useState(false);

  const availabilityCacheRef = useRef(availabilityCache);
  useEffect(() => {
    availabilityCacheRef.current = availabilityCache;
  }, [availabilityCache]);

  useEffect(() => {
    if (!session) {
      router.replace('/(auth)/sign-in');
    } else {
      setIsReady(true);
    }
  }, [session]);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setElementsLoaded({
          recommended: false,
          restaurants: false
        });
        const data = await RestaurantService.getAllRestaurants();
        setRestaurants(data);
        setFilteredRestaurants(data);
        
        setTimeout(() => {
          setElementsLoaded(prev => ({...prev, recommended: true}));
          setTimeout(() => {
            setElementsLoaded(prev => ({...prev, restaurants: true}));
            setLoading(false);
          }, 150);
        }, 150);
      } catch (error) {
        console.error('Error loading restaurants:', error);
        setLoading(false);
      }
    };

    loadRestaurants();
    
    const updateExpiredReservationsAndRefresh = async () => {
      try {
        console.log('Verificare rezervări expirate la încărcarea paginii Home...');
        
        const updated = await RestaurantService.updateExpiredReservations();
        
        setTimeout(() => {
          console.log('Reîncărcăm restaurantele după actualizarea rezervărilor...');
          loadRestaurants();
        }, 1000);
      } catch (error) {
        console.error('Eroare la verificarea rezervărilor expirate:', error);
      }
    };
    
    updateExpiredReservationsAndRefresh();
    
    const refreshIntervalId = setInterval(loadRestaurants, 5 * 60 * 1000);
    
    return () => {
      clearInterval(refreshIntervalId);
    };
  }, []);

  const getCacheKey = useCallback((restaurantId: string, date: Date, time: Date, people: number) => {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = time.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${restaurantId}-${dateStr}-${timeStr}-${people}`;
  }, []);

  const checkRestaurantsAvailability = useCallback(async () => {
    if (!selectedDate || !selectedTime || !selectedPeople) {
      setAvailableRestaurants(new Set(restaurants.map((r: Restaurant) => r.id)));
      return;
    }

    setCheckingAvailability(true);
    const available = new Set<string>();
    const newCache: { [key: string]: boolean } = {};

    try {
      const availabilityChecks = restaurants.map(async (restaurant) => {
        const cacheKey = getCacheKey(restaurant.id, selectedDate, selectedTime, selectedPeople);
        
        if (availabilityCacheRef.current[cacheKey] !== undefined) {
          newCache[cacheKey] = availabilityCacheRef.current[cacheKey];
          if (availabilityCacheRef.current[cacheKey]) {
            available.add(restaurant.id);
          }
          return;
        }

        const dateStr = selectedDate.toISOString().split('T')[0];
        const timeStr = selectedTime.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        const isAvailable = await RestaurantService.getRestaurantAvailability(
          restaurant.id,
          dateStr,
          timeStr,
          selectedPeople
        );

        newCache[cacheKey] = isAvailable;
        if (isAvailable) {
          available.add(restaurant.id);
        }
      });

      await Promise.all(availabilityChecks);

      setAvailabilityCache(prev => ({ ...prev, ...newCache }));
      setAvailableRestaurants(available);
    } catch (error) {
      console.error('Eroare la verificarea disponibilității:', error);
    } finally {
      setCheckingAvailability(false);
    }
  }, [selectedDate, selectedTime, selectedPeople, restaurants, getCacheKey]);

  const debouncedCheckAvailability = useMemo(
    () => debounce(checkRestaurantsAvailability, 500),
    [checkRestaurantsAvailability]
  );

  useEffect(() => {
    setAvailabilityCache({});
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    debouncedCheckAvailability();
    
    return () => {
      debouncedCheckAvailability.cancel();
    };
  }, [debouncedCheckAvailability]);

  useEffect(() => {
    let filtered = restaurants;
    
    if (searchQuery) {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCuisine !== 'Toate') {
      filtered = filtered.filter(restaurant =>
        restaurant.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase())
      );
    }

    if (selectedDate && selectedTime && selectedPeople) {
      filtered = filtered.filter(restaurant => 
        availableRestaurants.has(restaurant.id)
      );
    }
    
    setFilteredRestaurants(filtered);
  }, [searchQuery, selectedCuisine, restaurants, availableRestaurants, selectedDate, selectedTime, selectedPeople]);

  useEffect(() => {
    const fetchAllAverages = async () => {
      const averages: { [restaurantId: string]: number | null } = {};
      await Promise.all(restaurants.map(async (restaurant) => {
        const reviews = await ReviewService.getReviewsForRestaurant(restaurant.id);
        if (reviews.length > 0) {
          const avg = reviews.reduce((acc, r) => acc + (r.general_rating || 0), 0) / reviews.length;
          averages[restaurant.id] = Number(avg.toFixed(1));
        } else {
          averages[restaurant.id] = null;
        }
      }));
      setReviewAverages(averages);
    };
    if (restaurants.length > 0) fetchAllAverages();
  }, [restaurants]);

  if (!isReady) {
    return null;
  }

  const filterRestaurants = (restaurant: Restaurant) => {
    const matchesCuisine = selectedCuisine === 'Toate' || 
      restaurant.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase());
    
    const matchesSearch = searchQuery === '' || 
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCuisine && matchesSearch;
  };

  const recommendedRestaurantsList = filteredRestaurants.filter(
    restaurant => restaurant.status === 'Popular' || restaurant.status === 'Fine Dining'
  );

  const RecommendedCard = ({ restaurant }: { restaurant: Restaurant }) => {
    const { favorites, toggleFavorite } = useFavorites();
    const isFavorite = favorites.includes(restaurant.id);
    const router = useRouter();

    return (
      <Pressable
        style={({ pressed }) => [
          styles.recommendedCard,
          pressed && { opacity: 0.7 }
        ]}
        onPress={() => {
          console.log('Apasat card restaurant', restaurant.id);
          router.push(`/restaurant/${restaurant.id}`);
        }}
      >
        <Image source={{ uri: restaurant.image }} style={styles.recommendedImage} />
        <View style={styles.recommendedInfo}>
          <View style={styles.recommendedHeader}>
            <Text style={styles.recommendedName}>{restaurant.name}</Text>
            <View style={styles.recommendedRating}>
              <IconSymbol name="star.fill" size={16} color="#FF9500" />
              <Text style={styles.rating}>{reviewAverages[restaurant.id] !== undefined && reviewAverages[restaurant.id] !== null ? reviewAverages[restaurant.id] : 'N/A'}</Text>
            </View>
          </View>
          <Text style={styles.recommendedCuisine}>{restaurant.cuisine}</Text>
        </View>
      </Pressable>
    );
  };

  const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => {
    const router = useRouter();
    const { favorites, toggleFavorite } = useFavorites();
    const isFavorite = favorites.includes(restaurant.id);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.restaurantCard,
          pressed && { opacity: 0.7 }
        ]}
        onPress={() => {
          console.log('Apasat card restaurant', restaurant.id);
          router.push(`/restaurant/${restaurant.id}`);
        }}
      >
        <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantHeader}>
            <View style={styles.restaurantNameContainer}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <View style={styles.ratingContainer}>
                <IconSymbol name="star.fill" size={16} color="#FF9500" />
                <Text style={styles.rating}>{reviewAverages[restaurant.id] !== undefined && reviewAverages[restaurant.id] !== null ? reviewAverages[restaurant.id] : 'N/A'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(restaurant.id)}
            >
              <IconSymbol
                name="heart.fill"
                size={24}
                color={isFavorite ? '#FF2D55' : '#8E8E93'}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.cuisine}>{restaurant.cuisine}</Text>

          {restaurant.discount && (
            <View style={styles.discountContainer}>
              <IconSymbol name="star.fill" size={16} color="#FF9500" />
              <Text style={styles.discount}>{restaurant.discount}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const CUISINES = [
    'Toate',
    'Italiană',
    'Japoneză',
    'Americană',
    'Europeană',
    'Internațională',
    'Cafenea',
    'Bar',
    'Fine Dining',
    'Mediteraneană',
  ];

  const getNextDays = (numDays: number) => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < numDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8-22
  const MINUTES = [0, 15, 30, 45];

  const handleCustomDateChange = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour);
    setShowMinutePicker(true);
  };

  const handleMinuteSelect = (minute: number) => {
    if (selectedHour !== null) {
      const newTime = new Date(selectedTime);
      newTime.setHours(selectedHour, minute, 0, 0);
      setSelectedTime(newTime);
    }
    setShowMinutePicker(false);
    setShowTimePicker(false);
    setSelectedHour(null);
  };

  const handleOpenTimePicker = () => {
    setShowTimePicker(true);
    setShowMinutePicker(false);
    setSelectedHour(null);
  };

  const handlePeopleChange = (value: number) => {
    setSelectedPeople(value);
    setShowPeoplePicker(false);
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    router.push({
      pathname: '/reservation/confirm',
      params: { 
        restaurantId: restaurant.id,
        date: selectedDate.toISOString(),
        time: selectedTime.toISOString(),
        guests: selectedPeople.toString()
      }
    });
  };

  const renderRestaurantList = () => {
    if (loading || !elementsLoaded.restaurants) {
      return Array.from({ length: 5 }).map((_, index) => (
        <SkeletonRestaurantCard key={index} delay={index * 50} />
      ));
    }

    if (checkingAvailability) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Se verifică disponibilitatea...
          </Text>
        </View>
      );
    }

    if (filteredRestaurants.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Text style={[styles.noResultsText, { color: theme.colors.text }]}>
            {selectedDate && selectedTime && selectedPeople
              ? 'Nu s-au găsit restaurante disponibile pentru criteriile selectate.'
              : 'Nu s-au găsit restaurante care să corespundă criteriilor de căutare.'}
          </Text>
        </View>
      );
    }

    return filteredRestaurants.map((restaurant) => (
      <RestaurantCard key={restaurant.id} restaurant={restaurant} />
    ));
  };

  return (
    <AnimatedPage type="fadeIn" duration={500}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView style={[styles.scrollView, { paddingTop: insets.top }]}>
          <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
            <View style={styles.headerTop}>
              <View style={styles.logoContainer}>
                <Image source={require('../../assets/logo-nobackground.png')} style={styles.logo} />
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity onPress={() => router.push('/notifications')}>
                  <IconSymbol name="bell.fill" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/profile')}>
                  <IconSymbol name="person.2.fill" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
              <IconSymbol name="magnifyingglass" size={20} color={theme.colors.placeholder} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Caută restaurante..."
                placeholderTextColor={theme.colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.colors.card }]}
                onPress={() => setShowDatePicker(true)}
              >
                <IconSymbol name="calendar" size={20} color={theme.colors.text} />
                <Text style={[styles.filterText, { color: theme.colors.text }]}>
                  {selectedDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.colors.card }]}
                onPress={handleOpenTimePicker}
              >
                <IconSymbol name="calendar" size={20} color={theme.colors.text} />
                <Text style={[styles.filterText, { color: theme.colors.text }]}>
                  {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.colors.card }]}
                onPress={() => setShowPeoplePicker(true)}
              >
                <IconSymbol name="person.2.fill" size={20} color={theme.colors.text} />
                <Text style={[styles.filterText, { color: theme.colors.text }]}>
                  {selectedPeople} {selectedPeople === 1 ? 'persoană' : 'persoane'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cuisine */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.cuisineScroll}
          >
            {CUISINES.map((cuisine, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.cuisineButton,
                  { backgroundColor: theme.colors.card },
                  selectedCuisine === cuisine && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => setSelectedCuisine(cuisine)}
              >
                <Text style={[
                  styles.cuisineText,
                  { color: selectedCuisine === cuisine ? '#FFFFFF' : theme.colors.text }
                ]}>{cuisine}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {!searchQuery && selectedCuisine === 'Toate' && (
            <View style={styles.featuredSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Restaurante Recomandate</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendedContainer}>
                {loading || !elementsLoaded.recommended ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <View key={index} style={[styles.recommendedCard, { backgroundColor: theme.colors.card }]}> 
                      <SkeletonRestaurantCard showImageSize="large" delay={index * 50} />
                    </View>
                  ))
                ) : (
                  recommendedRestaurantsList.map((restaurant) => (
                    <RecommendedCard key={restaurant.id} restaurant={restaurant} />
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {searchQuery && (
            <View style={styles.searchResultsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Rezultate pentru "{searchQuery}"
              </Text>
            </View>
          )}
          
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Toate restaurantele</Text>

          {renderRestaurantList()}
        </ScrollView>

        {showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>  
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Selectați data</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  {getNextDays(14).map((date, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.peopleOption,
                        selectedDate.toDateString() === date.toDateString() && { backgroundColor: theme.colors.primary }
                      ]}
                      onPress={() => handleCustomDateChange(date)}
                    >
                      <Text
                        style={[
                          styles.peopleOptionText,
                          { color: selectedDate.toDateString() === date.toDateString() ? '#fff' : theme.colors.text }
                        ]}
                      >
                        {date.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.closeButtonText}>Închide</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {showTimePicker && !showMinutePicker && (
          <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>  
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Selectați ora</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  {HOURS.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.peopleOption,
                        selectedTime.getHours() === hour && { backgroundColor: theme.colors.primary }
                      ]}
                      onPress={() => handleHourSelect(hour)}
                    >
                      <Text
                        style={[
                          styles.peopleOptionText,
                          { color: selectedTime.getHours() === hour ? '#fff' : theme.colors.text, fontSize: 20, fontWeight: 'bold', textAlign: 'center' }
                        ]}
                      >
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.closeButtonText}>Închide</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {showTimePicker && showMinutePicker && (
          <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>  
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Selectați minutele</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  {MINUTES.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.peopleOption,
                        selectedHour !== null && selectedTime.getHours() === selectedHour && selectedTime.getMinutes() === minute && { backgroundColor: theme.colors.primary }
                      ]}
                      onPress={() => handleMinuteSelect(minute)}
                    >
                      <Text
                        style={[
                          styles.peopleOptionText,
                          { color: selectedHour !== null && selectedTime.getHours() === selectedHour && selectedTime.getMinutes() === minute ? '#fff' : theme.colors.text, fontSize: 20, fontWeight: 'bold', textAlign: 'center' }
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    setShowMinutePicker(false);
                    setShowTimePicker(false);
                    setSelectedHour(null);
                  }}
                >
                  <Text style={styles.closeButtonText}>Închide</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {showPeoplePicker && (
          <Modal
            visible={showPeoplePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPeoplePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Selectați numărul de persoane
                </Text>
                <ScrollView style={styles.peopleScroll}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
                    <TouchableOpacity
                      key={number}
                      style={[
                        styles.peopleOption,
                        selectedPeople === number && { backgroundColor: theme.colors.primary }
                      ]}
                      onPress={() => handlePeopleChange(number)}
                    >
                      <Text
                        style={[
                          styles.peopleOptionText,
                          { color: selectedPeople === number ? '#fff' : theme.colors.text }
                        ]}
                      >
                        {number} {number === 1 ? 'persoană' : 'persoane'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setShowPeoplePicker(false)}
                >
                  <Text style={styles.closeButtonText}>Închide</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </AnimatedPage>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 0,
    marginBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    height: 70,
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 20,
    paddingLeft: 20,
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    marginLeft: 8,
  },
  cuisineScroll: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cuisineButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cuisineText: {
    fontSize: 15,
    fontWeight: '600',
  },
  featuredSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginLeft: 16,
  },
  restaurantCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
  },
  restaurantImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 15,
    fontWeight: '600',
  },
  cuisine: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  discount: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  favoriteButton: {
    padding: 8,
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  picker: {
    height: 200,
  },
  recommendedContainer: {
    paddingLeft: 16,
    marginBottom: 20,
  },
  recommendedCard: {
    width: 320,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
  },
  recommendedImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  recommendedInfo: {
    padding: 12,
  },
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendedName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  recommendedRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendedCuisine: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    minHeight: '50%',
  },
  closeButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  peopleScroll: {
    maxHeight: 300,
  },
  peopleOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  peopleOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  searchResultsSection: {
    padding: 16,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
});

