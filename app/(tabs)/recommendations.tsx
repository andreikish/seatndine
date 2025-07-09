import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useRecommendations } from '@/contexts/RecommendationContext';
import { allRestaurants } from '@/data/restaurants';
import { MaterialIcons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ReviewService } from '@/services/ReviewService';

export default function RecommendationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { recommendedRestaurants, loading, error } = useRecommendations();
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewAverages, setReviewAverages] = useState<{ [restaurantId: string]: number | null }>({});

  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) return recommendedRestaurants;
    
    return recommendedRestaurants.filter(restaurant => 
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recommendedRestaurants, searchQuery]);

  React.useEffect(() => {
    const fetchAllAverages = async () => {
      const averages: { [restaurantId: string]: number | null } = {};
      await Promise.all(recommendedRestaurants.map(async (restaurant) => {
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
    if (recommendedRestaurants.length > 0) fetchAllAverages();
  }, [recommendedRestaurants]);

  const handleRestaurantPress = (id: string) => {
    router.push(`/restaurant/${id}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Se încarcă recomandările...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Recomandări personalizate
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Bazate pe preferințele tale și experiențele anterioare
        </Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.placeholder} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Caută în recomandări..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {recommendedRestaurants.length > 0 ? (
        <View style={styles.recommendations}>
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.map(restaurant => (
              <TouchableOpacity
                key={restaurant.id}
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() => handleRestaurantPress(restaurant.id)}
              >
                <Image
                  source={{ uri: restaurant.image }}
                  style={styles.image}
                />
                <View style={styles.content}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {restaurant.name}
                  </Text>
                  <Text style={[styles.cuisine, { color: colors.text }]}>
                    {restaurant.cuisine}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <MaterialIcons
                      name="star"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={[styles.rating, { color: colors.text }]}>
                      {reviewAverages[restaurant.id] !== undefined && reviewAverages[restaurant.id] !== null ? reviewAverages[restaurant.id] : 'N/A'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.empty}>
              <MaterialIcons
                name="search-off"
                size={48}
                color={colors.text}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Nu am găsit restaurante care să corespundă căutării.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.empty}>
          <MaterialIcons
            name="restaurant"
            size={48}
            color={colors.text}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Nu avem încă suficiente date pentru a face recomandări personalizate.
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text }]}>
            Fă mai multe rezervări și oferă feedback pentru a primi recomandări mai bune.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    marginTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
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
  recommendations: {
    padding: 16,
  },
  card: {
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
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