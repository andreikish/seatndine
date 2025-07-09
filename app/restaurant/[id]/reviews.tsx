import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ReviewService } from '@/services/ReviewService';
import type { Review } from '@/types/review';
import { MaterialIcons } from '@expo/vector-icons';

export default function RestaurantReviewsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? require('@/app/config/theme').darkTheme : require('@/app/config/theme').lightTheme;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const data = await ReviewService.getReviewsForRestaurant(id as string);
        setReviews(data);
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [id]);

  const reviewCount = reviews.length;
  const avg = (arr: (number | null | undefined)[]) => {
    const vals = arr.filter((v): v is number => typeof v === 'number');
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };
  const avgGeneral = avg(reviews.map(r => r.general_rating));
  const avgService = avg(reviews.map(r => r.service_rating));
  const avgFood = avg(reviews.map(r => r.food_rating));
  const avgAmbiance = avg(reviews.map(r => r.ambiance_rating));

  const renderStars = (value: number) => (
    <View style={{ flexDirection: 'row' }}>
      {Array(5).fill(0).map((_, i) => (
        <MaterialIcons
          key={i}
          name={i < value ? 'star' : 'star-border'}
          size={20}
          color={theme.colors.primary}
        />
      ))}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.colors.primary, fontSize: 16 }}>{'< Înapoi la restaurant'}</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.colors.text }]}>Recenzii</Text>
      {loading ? (
        <Text style={{ color: theme.colors.text, marginTop: 24 }}>Se încarcă...</Text>
      ) : reviewCount === 0 ? (
        <Text style={{ color: theme.colors.text, marginTop: 24 }}>Nu există recenzii pentru acest restaurant.</Text>
      ) : (
        <>
          <View style={styles.averagesBox}>
            <Text style={[styles.avgTitle, { color: theme.colors.text }]}>Medii recenzii:</Text>
            <Text style={[styles.avgRow, { color: theme.colors.text }]}>General: {avgGeneral ?? 'N/A'} {avgGeneral && renderStars(Number(avgGeneral))}</Text>
            <Text style={[styles.avgRow, { color: theme.colors.text }]}>Servire: {avgService ?? 'N/A'} {avgService && renderStars(Number(avgService))}</Text>
            <Text style={[styles.avgRow, { color: theme.colors.text }]}>Mâncare: {avgFood ?? 'N/A'} {avgFood && renderStars(Number(avgFood))}</Text>
            <Text style={[styles.avgRow, { color: theme.colors.text }]}>Ambianță: {avgAmbiance ?? 'N/A'} {avgAmbiance && renderStars(Number(avgAmbiance))}</Text>
          </View>
          {reviews.map((review) => (
            <View key={review.id} style={[styles.reviewCard, { backgroundColor: theme.colors.card }]}> 
              <View style={styles.reviewHeader}>
                {renderStars(review.general_rating)}
                <Text style={[styles.reviewDate, { color: theme.colors.text }]}>{new Date(review.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.reviewCategory, { color: theme.colors.text }]}>Servire: {renderStars(review.service_rating)}</Text>
              {typeof review.food_rating === 'number' && <Text style={[styles.reviewCategory, { color: theme.colors.text }]}>Mâncare: {renderStars(review.food_rating)}</Text>}
              {typeof review.ambiance_rating === 'number' && <Text style={[styles.reviewCategory, { color: theme.colors.text }]}>Ambianță: {renderStars(review.ambiance_rating)}</Text>}
              {review.text && <Text style={[styles.reviewText, { color: theme.colors.text }]}>{review.text}</Text>}
              {review.is_anonymous && <Text style={{ color: theme.colors.placeholder, fontStyle: 'italic', marginTop: 4 }}>Recenzie anonimă</Text>}
            </View>
          ))}
        </>
      )}
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
  averagesBox: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2222',
  },
  avgTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  avgRow: {
    fontSize: 16,
    marginBottom: 4,
  },
  reviewCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 14,
    color: '#888',
  },
  reviewCategory: {
    fontSize: 15,
    marginBottom: 2,
  },
  reviewText: {
    fontSize: 16,
    marginTop: 8,
  },
}); 