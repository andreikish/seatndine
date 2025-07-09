import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert, Animated as RNAnimated, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReservations } from '@/contexts/ReservationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useSearch } from '@/contexts/SearchContext';
import { RestaurantService } from '@/services/RestaurantService';
import { ReviewService } from '@/services/ReviewService';
import type { Restaurant } from '@/types/restaurant';
import type { Review } from '@/types/review';
import { RestaurantTableAvailability } from '@/components/RestaurantTableAvailability';
import { AnimatedPage, FadeIn, SkeletonLoader } from '@/components/animated';
import { ScreenTransition } from '@/components/animated/ScreenTransition';
import { supabase } from '@/lib/supabase';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { addReservation } = useReservations();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const { selectedDate, selectedTime, selectedPeople } = useSearch();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scaleAnim] = useState(new RNAnimated.Value(1));
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now()); 
  const [elementsLoaded, setElementsLoaded] = useState({
    basic: false,
    contact: false,
    description: false,
    menu: false,
    tables: false
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [filteredTables, setFilteredTables] = useState<{ interior: any[]; exterior: any[] } | null>(null);

  const theme = isDarkMode ? darkTheme : lightTheme;
  const isFavorite = restaurant ? favorites.includes(restaurant.id) : false;

  const loadRestaurant = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setElementsLoaded({
        basic: false,
        contact: false,
        description: false,
        menu: false,
        tables: false
      });
      
      const restaurantData = await RestaurantService.getRestaurantById(id as string);
      
      if (!restaurantData) {
        setError('Restaurantul nu a fost găsit');
        return;
      }

      console.log('Date restaurant primite de la service:', restaurantData);
      console.log('URL meniu din datele primite:', restaurantData.menuPdf);
      console.log('Structura meselor:', JSON.stringify(restaurantData.tables, null, 2));
      
      setRestaurant(restaurantData);
      
      const isAdminCheck = await RestaurantService.isRestaurantAdmin(id as string);
      setIsAdmin(isAdminCheck);
      
      setTimeout(() => {
        setElementsLoaded(prev => ({...prev, basic: true}));
        
        setTimeout(() => {
          setElementsLoaded(prev => ({...prev, contact: true}));
          
          setTimeout(() => {
            setElementsLoaded(prev => ({...prev, description: true}));
            
            setTimeout(() => {
              setElementsLoaded(prev => ({...prev, menu: true}));
              
              setTimeout(() => {
                setElementsLoaded(prev => ({...prev, tables: true}));
                setLoading(false);
              }, 100);
            }, 100);
          }, 100);
        }, 100);
      }, 200);
      
    } catch (err) {
      setError('Eroare la încărcarea datelor');
      console.error(err);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const checkExpiredReservationsAndLoadRestaurant = async () => {
      try {
        console.log('Verificare rezervări expirate înainte de afișarea detaliilor restaurantului...');
        
        await RestaurantService.updateExpiredReservations();
        
        setTimeout(() => {
          console.log('Încărcăm restaurantul după verificarea rezervărilor expirate...');
          loadRestaurant();
        }, 1000);
      } catch (error) {
        console.error('Eroare la verificarea rezervărilor expirate:', error);
        loadRestaurant();
      }
    };
    
    checkExpiredReservationsAndLoadRestaurant();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!restaurant) return;
      setReviewsLoading(true);
      try {
        const data = await ReviewService.getReviewsForRestaurant(restaurant.id);
        setReviews(data);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [restaurant]);

  useEffect(() => {
    if (!restaurant) return;
    const fetchAndMarkTables = async () => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'confirmed')
        .gte('reservation_time', `${dateStr}T00:00:00`)
        .lte('reservation_time', `${dateStr}T23:59:59`);
      if (error) {
        setFilteredTables(restaurant.tables);
        return;
      }
      const requestedStart = new Date(`${dateStr}T${selectedTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}`);
      const requestedEnd = new Date(requestedStart);
      requestedEnd.setHours(requestedEnd.getHours() + 2);
      const markTables = (tables: any[]) => tables.map(table => {
        const isOccupied = (reservations || []).some(res => {
          if (res.table_id !== table.id) return false;
          const resStart = new Date(res.reservation_time);
          const resEnd = new Date(resStart);
          resEnd.setHours(resEnd.getHours() + 2);
          return requestedStart < resEnd && requestedEnd > resStart;
        });
        return { ...table, isAvailable: table.isAvailable && !isOccupied };
      });
      setFilteredTables({
        interior: markTables(restaurant.tables.interior),
        exterior: markTables(restaurant.tables.exterior)
      });
    };
    fetchAndMarkTables();
  }, [restaurant, selectedDate, selectedTime, selectedPeople]);

  useFocusEffect(
    useCallback(() => {
      console.log('Pagina restaurantului a primit focus, reîncărcăm datele...');
      setLastUpdate(Date.now());
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView style={{ flex: 1, paddingTop: insets.top }}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: theme.colors.card }]} 
              onPress={() => router.back()}
            >
              <IconSymbol name="chevron.left" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <SkeletonLoader height={250} style={styles.headerImage} />
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.restaurantInfo}>
              <SkeletonLoader height={28} width="70%" style={{ marginBottom: 12 }} />
              <View style={styles.ratingContainer}>
                <SkeletonLoader height={16} width={120} />
              </View>
              <SkeletonLoader height={18} width="50%" style={{ marginTop: 8 }} />
            </View>
            
            <FadeIn delay={200} from="bottom">
              <View style={[styles.section, { backgroundColor: theme.colors.card, marginTop: 16 }]}>
                <SkeletonLoader height={24} width="40%" style={{ marginBottom: 16 }} />
                <View>
                  <SkeletonLoader height={18} width="90%" style={{ marginBottom: 10 }} />
                  <SkeletonLoader height={18} width="60%" style={{ marginBottom: 10 }} />
                  <SkeletonLoader height={18} width="75%" />
                </View>
              </View>
            </FadeIn>
            
            <FadeIn delay={300} from="bottom">
              <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                <SkeletonLoader height={24} width="40%" style={{ marginBottom: 16 }} />
                <SkeletonLoader height={120} width="100%" style={{ borderRadius: 8 }} />
              </View>
            </FadeIn>
            
            <FadeIn delay={400} from="bottom">
              <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                <SkeletonLoader height={24} width="40%" style={{ marginBottom: 16 }} />
                <SkeletonLoader height={100} width="100%" style={{ borderRadius: 8 }} />
              </View>
            </FadeIn>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <AnimatedPage type="fadeIn">
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
        </View>
      </AnimatedPage>
    );
  }

  if (!restaurant) {
    return (
      <AnimatedPage type="fadeIn">
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>Restaurantul nu a fost găsit</Text>
        </View>
      </AnimatedPage>
    );
  }

  const handleReservation = () => {
    if (!user) {
      Alert.alert('Autentificare necesară', 'Trebuie să fii autentificat pentru a face o rezervare.');
      return;
    }

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

  const handleFavoritePress = () => {
    if (restaurant) {
      RNAnimated.sequence([
        RNAnimated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        RNAnimated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      toggleFavorite(restaurant.id);
    }
  };

  const handlePhonePress = () => {
    Linking.openURL(`tel:${restaurant.phone}`);
  };

  const handleAddressPress = () => {
    const coords = restaurant.location || restaurant.coordinates;
    
    if (!coords || !coords.latitude || !coords.longitude) {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const searchQuery = encodeURIComponent(restaurant.name);
      const url = Platform.select({
        ios: `${scheme}${searchQuery}`,
        android: `${scheme}${searchQuery}`
      });
      Linking.openURL(url!);
    } else {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${coords.latitude},${coords.longitude}`;
      const label = encodeURIComponent(restaurant.name);
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`
      });
      Linking.openURL(url!);
    }
  };

  const handleWebsitePress = () => {
    Linking.openURL(restaurant.website);
  };

  const handleMenuPress = () => {
    console.log('Detalii restaurant complete:', JSON.stringify(restaurant, null, 2));
    
    const menuPdfUrl = restaurant.menuPdf || 
                       (restaurant as any).meniuPdf || 
                       (restaurant as any).MeniuPdf || 
                       (restaurant as any).menu_pdf || 
                       '';
    
    console.log('URL PDF meniu detectat:', menuPdfUrl);
    console.log('Tipul menuPdfUrl:', typeof menuPdfUrl);
    
    if (menuPdfUrl) {
      console.log('Navigare către ecranul de meniu cu URL:', menuPdfUrl);
      router.push({
        pathname: '/restaurant/menu',
        params: { 
          menuUrl: menuPdfUrl,
          restaurantName: restaurant.name
        }
      });
    } else {
      Alert.alert('Meniu indisponibil', 'Meniul nu este disponibil momentan. Contactați restaurantul pentru informații despre meniu.');
    }
  };

  const handleRefreshTables = () => {
    console.log('Reîncărcare manuală a datelor despre disponibilitatea meselor...');
    setLastUpdate(Date.now());
  };

  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0 ? (reviews.reduce((acc, r) => acc + (r.general_rating || 0), 0) / reviewCount).toFixed(1) : null;

  return (
    <AnimatedPage type="fadeIn">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: theme.colors.card }]} 
              onPress={() => router.back()}
            >
              <IconSymbol name="chevron.left" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            
            <RNAnimated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity 
                style={[styles.favoriteButton, { backgroundColor: theme.colors.card }]} 
                onPress={handleFavoritePress}
              >
                <IconSymbol 
                  name={isFavorite ? "heart.fill" : "heart.circle"} 
                  size={20} 
                  color={isFavorite ? theme.colors.notification : theme.colors.text} 
                />
              </TouchableOpacity>
            </RNAnimated.View>
          </View>

          <SkeletonLoader height={250} style={styles.headerImage} isLoading={loading || !elementsLoaded.basic}>
            <Image
              source={{ uri: restaurant?.image || 'https://via.placeholder.com/400' }}
              style={styles.headerImage}
              resizeMode="cover"
            />
          </SkeletonLoader>

          <View style={styles.restaurantInfo}>
            <SkeletonLoader height={28} width="70%" style={{ marginBottom: 12 }} isLoading={loading || !elementsLoaded.basic}>
              <Text style={[styles.restaurantName, { color: theme.colors.text }]}>{restaurant?.name}</Text>
            </SkeletonLoader>
            
            <View style={styles.ratingContainer}>
              <SkeletonLoader height={16} width={120} isLoading={loading || !elementsLoaded.basic}>
                <TouchableOpacity onPress={() => router.push(`/restaurant/${restaurant.id}/reviews`)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconSymbol name="star.fill" size={16} color="#FFD700" />
                  <Text style={[styles.rating, { color: theme.colors.text, marginLeft: 4 }]}> 
                    {reviewsLoading ? '...' : (avgRating ?? 'N/A')} • {reviewsLoading ? '' : `${reviewCount} recenzii`}
                  </Text>
                </TouchableOpacity>
              </SkeletonLoader>
            </View>
            
            <SkeletonLoader height={18} width="50%" style={{ marginTop: 8 }} isLoading={loading || !elementsLoaded.basic}>
              <Text style={[styles.cuisine, { color: theme.colors.text }]}>
                {restaurant?.cuisine} • {restaurant?.priceRange ?? '$$'}
              </Text>
            </SkeletonLoader>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.card, marginTop: 16 }]}>
            <SkeletonLoader height={24} width="40%" style={{ marginBottom: 16 }} isLoading={loading || !elementsLoaded.contact}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contact</Text>
            </SkeletonLoader>
            
            <SkeletonLoader height={18} width="90%" style={{ marginBottom: 10 }} isLoading={loading || !elementsLoaded.contact}>
              {restaurant && (
                <TouchableOpacity style={styles.contactItem} onPress={handleAddressPress}>
                  <IconSymbol name="map.fill" size={18} color={theme.colors.primary} />
                  <Text style={[styles.contactText, { color: theme.colors.text }]}>{restaurant.address}</Text>
                </TouchableOpacity>
              )}
            </SkeletonLoader>
            
            <SkeletonLoader height={18} width="60%" style={{ marginBottom: 10 }} isLoading={loading || !elementsLoaded.contact}>
              {restaurant && (
                <TouchableOpacity style={styles.contactItem} onPress={handlePhonePress}>
                  <IconSymbol name="phone.fill" size={18} color={theme.colors.primary} />
                  <Text style={[styles.contactText, { color: theme.colors.text }]}>{restaurant.phone}</Text>
                </TouchableOpacity>
              )}
            </SkeletonLoader>
            
            <SkeletonLoader height={18} width="75%" isLoading={loading || !elementsLoaded.contact}>
              {restaurant && restaurant.website && (
                <TouchableOpacity style={styles.contactItem} onPress={handleWebsitePress}>
                  <IconSymbol name="globe" size={18} color={theme.colors.primary} />
                  <Text style={[styles.contactText, { color: theme.colors.text }]}>{restaurant.website}</Text>
                </TouchableOpacity>
              )}
            </SkeletonLoader>
          </View>
          
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <SkeletonLoader height={24} width="40%" style={{ marginBottom: 16 }} isLoading={loading || !elementsLoaded.description}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Descriere</Text>
            </SkeletonLoader>
            
            <SkeletonLoader height={120} width="100%" style={{ borderRadius: 8 }} isLoading={loading || !elementsLoaded.description}>
              {restaurant && (
                <Text style={[styles.description, { color: theme.colors.text }]}>
                  {restaurant.description || 'Nu există descriere pentru acest restaurant.'}
                </Text>
              )}
            </SkeletonLoader>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <SkeletonLoader height={24} width="40%" style={{ marginBottom: 16 }} isLoading={loading || !elementsLoaded.menu}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Meniu</Text>
            </SkeletonLoader>
            
            <SkeletonLoader height={50} width="100%" style={{ borderRadius: 8 }} isLoading={loading || !elementsLoaded.menu}>
              {restaurant && (
                <TouchableOpacity 
                  style={[styles.menuButton, { backgroundColor: theme.colors.primary }]} 
                  onPress={handleMenuPress}
                >
                  <IconSymbol name="message.fill" size={20} color="#FFF" />
                  <Text style={styles.menuButtonText}>Vezi meniul</Text>
                </TouchableOpacity>
              )}
            </SkeletonLoader>
          </View>

          <SkeletonLoader height={60} style={{ margin: 16, borderRadius: 8 }} isLoading={loading || !elementsLoaded.menu}>
            {restaurant && (
              <TouchableOpacity 
                style={[styles.reserveButton, { backgroundColor: theme.colors.primary }]} 
                onPress={handleReservation}
              >
                <Text style={styles.reserveButtonText}>Rezervă o masă</Text>
                <IconSymbol name="calendar" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </SkeletonLoader>

          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <SkeletonLoader height={24} width="40%" style={{ marginBottom: 0 }} isLoading={loading || !elementsLoaded.tables}>
              <View style={[styles.tablesHeader, { marginBottom: 0 }]}> 
                <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 0 }]}>Mese disponibile</Text>
                {isAdmin && (
                  <TouchableOpacity onPress={handleRefreshTables}>
                    <IconSymbol name="house.fill" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </SkeletonLoader>
            
            {checkingAvailability ? (
              <Text style={{ marginBottom: 12, color: 'orange', fontWeight: 'bold' }}>Se verifică disponibilitatea...</Text>
            ) : isAvailable !== null && (
              <Text style={{ marginBottom: 12, color: isAvailable ? 'green' : 'red', fontWeight: 'bold' }}>
                {isAvailable
                  ? `Disponibil pentru ${selectedPeople} ${selectedPeople === 1 ? 'persoană' : 'persoane'} la ${selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} pe ${selectedDate.toLocaleDateString('ro-RO')}`
                  : `Nu este disponibil pentru ${selectedPeople} ${selectedPeople === 1 ? 'persoană' : 'persoane'} la ${selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} pe ${selectedDate.toLocaleDateString('ro-RO')}`}
              </Text>
            )}
            
            <SkeletonLoader height={100} width="100%" style={{ borderRadius: 8 }} isLoading={loading || !elementsLoaded.tables}>
              {restaurant && filteredTables && filteredTables.interior && filteredTables.exterior && 
               (filteredTables.interior.length > 0 || filteredTables.exterior.length > 0) ? (
                <RestaurantTableAvailability 
                  tables={filteredTables} 
                  restaurantId={restaurant.id}
                  isAdmin={isAdmin}
                  onRefresh={loadRestaurant}
                />
              ) : (
                <Text style={[styles.noTables, { color: theme.colors.placeholder }]}>
                  Nu există mese configurate pentru acest restaurant.
                </Text>
              )}
            </SkeletonLoader>
          </View>

          {restaurant && isAdmin && !loading && (
            <FadeIn delay={100} from="bottom">
              <View style={styles.adminButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.editButton, { backgroundColor: theme.colors.secondary, flex: 1, marginRight: 8 }]} 
                  onPress={() => router.push(`/restaurant/${restaurant.id}/edit`)}
                >
                  <IconSymbol name="pencil" size={20} color="#FFF" />
                  <Text style={styles.editButtonText}>Editează restaurantul</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.editButton, { backgroundColor: theme.colors.primary, flex: 1, marginLeft: 8 }]} 
                  onPress={() => router.push(`/restaurant/${restaurant.id}/calendar`)}
                >
                  <IconSymbol name="calendar" size={20} color="#FFF" />
                  <Text style={styles.editButtonText}>Vezi calendarul</Text>
                </TouchableOpacity>
              </View>
            </FadeIn>
          )}
        </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerImage: {
    width: '100%',
    height: 250,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
  },
  cuisine: {
    fontSize: 14,
    marginBottom: 4,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuButtonText: {
    marginLeft: 8,
    color: '#FFF',
    fontWeight: 'bold',
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  reserveButtonText: {
    marginRight: 8,
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: {
    marginLeft: 8,
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  progressBar: {
    width: '80%',
    alignSelf: 'center',
    marginTop: 10,
  },
  tablesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noTables: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  adminButtonsContainer: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 8,
  },
}); 