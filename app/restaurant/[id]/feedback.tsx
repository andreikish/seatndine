import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useFeedback } from '@/contexts/FeedbackContext';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { RestaurantService } from '@/services/RestaurantService';

export default function RestaurantFeedbackScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { addFeedback, getFeedbackForRestaurant } = useFeedback();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    if (id) {
      RestaurantService.getRestaurantById(id as string).then(setRestaurant);
    }
  }, [id]);

  const feedbacks = getFeedbackForRestaurant(id as string);

  const handleSubmit = () => {
    if (!user || !restaurant) return;

    addFeedback({
      restaurantId: restaurant.id,
      rating,
      comment,
      photos
    });

    router.back();
  };

  const renderStars = (value: number) => {
    return Array(5).fill(0).map((_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setRating(index + 1)}
      >
        <MaterialIcons
          name={index < value ? 'star' : 'star-border'}
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Feedback pentru {restaurant?.name}
        </Text>
      </View>

      {user ? (
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>Rating</Text>
          <View style={styles.stars}>
            {renderStars(rating)}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Comentariu</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }]}
            value={comment}
            onChangeText={setComment}
            placeholder="Scrie un comentariu..."
            placeholderTextColor={colors.text}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>Trimite feedback</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={[styles.message, { color: colors.text }]}>
          Trebuie să fii autentificat pentru a putea oferi feedback.
        </Text>
      )}

      <View style={styles.feedbacks}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Feedback-uri anterioare
        </Text>
        {feedbacks.map(feedback => (
          <View
            key={feedback.id}
            style={[styles.feedbackCard, { backgroundColor: colors.card }]}
          >
            <View style={styles.feedbackHeader}>
              <View style={styles.stars}>
                {Array(5).fill(0).map((_, index) => (
                  <MaterialIcons
                    key={index}
                    name={index < feedback.rating ? 'star' : 'star-border'}
                    size={16}
                    color={colors.primary}
                  />
                ))}
              </View>
              <Text style={[styles.date, { color: colors.text }]}>
                {new Date(feedback.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.comment, { color: colors.text }]}>
              {feedback.comment}
            </Text>
            {feedback.photos && feedback.photos.length > 0 && (
              <ScrollView horizontal style={styles.photos}>
                {feedback.photos.map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: photo }}
                    style={styles.photo}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
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
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    padding: 16,
    textAlign: 'center',
  },
  feedbacks: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
  },
  comment: {
    fontSize: 16,
    marginBottom: 8,
  },
  photos: {
    flexDirection: 'row',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
}); 