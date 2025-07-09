import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useStatistics } from '@/contexts/StatisticsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function StatisticsScreen() {
  const { userStatistics, loading } = useStatistics();
  const { colors } = useTheme();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Statistici</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Se încarcă statisticile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userStatistics) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Statistici</Text>
        </View>
        <View style={styles.emptyState}>
          <IconSymbol name="star.fill" size={48} color={colors.text} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            Nu există date suficiente pentru statistici
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Statistici</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <IconSymbol name="calendar" color={colors.primary} size={24} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{userStatistics.totalReservations}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Total Rezervări</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <IconSymbol name="star.fill" color={colors.success} size={24} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{userStatistics.completedReservations}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Finalizate</Text>
            <Text style={[styles.percentage, { color: colors.success }]}>
              {((userStatistics.completedReservations / userStatistics.totalReservations) * 100).toFixed(1)}%
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <IconSymbol name="xmark.circle.fill" color={colors.error} size={24} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{userStatistics.cancelledReservations}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Anulate</Text>
            <Text style={[styles.percentage, { color: colors.error }]}>
              {((userStatistics.cancelledReservations / userStatistics.totalReservations) * 100).toFixed(1)}%
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <IconSymbol name="clock" color={colors.warning} size={24} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{userStatistics.upcomingReservations}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Viitoare</Text>
            <Text style={[styles.percentage, { color: colors.warning }]}>
              {((userStatistics.upcomingReservations / userStatistics.totalReservations) * 100).toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bucătării favorite</Text>
          {userStatistics.favoriteCuisines.slice(0, 5).map((cuisine, index) => (
            <View key={index} style={styles.cuisineItem}>
              <Text style={[styles.cuisineName, { color: colors.text }]}>
                {cuisine.cuisine}
              </Text>
              <Text style={[styles.cuisineCount, { color: colors.text }]}>
                {cuisine.count} vizite
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Restaurante favorite</Text>
          {userStatistics.mostVisitedRestaurants.slice(0, 5).map((restaurant, index) => {
            const imageUri = restaurant.image;

            return (
              <View key={index} style={styles.restaurantItem}>
                <Image
                  source={imageUri ? { uri: imageUri } : require('@/assets/images/placeholder.png')}
                  style={styles.restaurantImage}
                />
                <View style={styles.restaurantInfo}>
                  <Text style={[styles.restaurantName, { color: colors.text }]}>
                    {restaurant.name}
                  </Text>
                  <Text style={[styles.restaurantCount, { color: colors.text }]}>
                    {restaurant.count} vizite
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Intervale de preț preferate</Text>
          {userStatistics.favoritePriceRanges.slice(0, 3).map((range, index) => (
            <View key={index} style={styles.priceItem}>
              <Text style={[styles.priceRange, { color: colors.text }]}>
                {range.range}
              </Text>
              <Text style={[styles.priceCount, { color: colors.text }]}>
                {range.count} vizite
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Suma cheltuită estimată</Text>
          <Text style={[styles.totalSpent, { color: colors.text }]}>
            {userStatistics.totalSpent.toLocaleString('ro-RO')} RON
          </Text>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 5,
  },
  percentage: {
    fontSize: 12,
    marginTop: 5,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cuisineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  cuisineName: {
    fontSize: 16,
  },
  cuisineCount: {
    fontSize: 14,
  },
  restaurantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  restaurantImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  restaurantInfo: {
    marginLeft: 12,
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  restaurantCount: {
    fontSize: 14,
    marginTop: 2,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  priceRange: {
    fontSize: 16,
  },
  priceCount: {
    fontSize: 14,
  },
  totalSpent: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 