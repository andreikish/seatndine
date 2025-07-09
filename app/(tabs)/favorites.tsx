import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFavorites } from '@/contexts/FavoritesContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Restaurant } from '@/types/restaurant';
import { supabase } from '@/lib/supabase';
import { ReviewService } from '@/services/ReviewService';

export default function FavoritesScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { favorites, toggleFavorite } = useFavorites();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewAverages, setReviewAverages] = useState<{ [restaurantId: string]: number | null }>({});

  useEffect(() => {
    loadRestaurants();
  }, [favorites]);

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

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .in('id', favorites);

      if (error) throw error;

      setRestaurants(data || []);
    } catch (error) {
      console.error('Eroare la încărcarea restaurantelor:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.restaurantCard, { backgroundColor: theme.colors.card }]}
      onPress={() => router.push(`/restaurant/${item.id}`)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.restaurantImage}
      />
      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantHeader}>
          <Text style={[styles.restaurantName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <TouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            style={styles.favoriteButton}
          >
            <IconSymbol
              name="heart.fill"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.ratingContainer}>
          <IconSymbol name="star.fill" size={16} color={theme.colors.primary} />
          <Text style={[styles.rating, { color: theme.colors.text }]}>
            {reviewAverages[item.id] !== undefined && reviewAverages[item.id] !== null ? reviewAverages[item.id] : 'N/A'}
          </Text>
          <Text style={[styles.priceRange, { color: theme.colors.text }]}>
            {item.priceRange}
          </Text>
          <Text style={[styles.distance, { color: theme.colors.text }]}>
            {item.distance}
          </Text>
        </View>

        <Text style={[styles.cuisine, { color: theme.colors.placeholder }]}>
          {item.cuisine}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Favorite</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
        <IconSymbol name="magnifyingglass" size={20} color={theme.colors.placeholder} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Caută în favorite..."
          placeholderTextColor={theme.colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredRestaurants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            {searchQuery ? 'Nu s-au găsit restaurante favorite care să corespundă căutării' : 'Nu aveți restaurante favorite'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          renderItem={renderRestaurantItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
  restaurantCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  restaurantImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    marginLeft: 4,
    marginRight: 12,
    fontSize: 14,
  },
  priceRange: {
    marginRight: 12,
    fontSize: 14,
  },
  distance: {
    fontSize: 14,
  },
  cuisine: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
