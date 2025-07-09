import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '../config/theme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useReservations } from '@/contexts/ReservationContext';
import { RestaurantService } from '@/services/RestaurantService';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { ReviewService } from '@/services/ReviewService';
import { useRouter } from 'expo-router';

export default function ReservationsScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const { getUpcomingReservations, getPastReservations, cancelReservation } = useReservations();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const router = useRouter();
  const [reviewedReservations, setReviewedReservations] = useState<string[]>([]);

  const upcomingReservations = getUpcomingReservations();
  const pastReservations = getPastReservations();

  useEffect(() => {
    const checkExpiredReservations = async () => {
      try {
        console.log('Verificare rezervări expirate în pagina de rezervări...');
        await RestaurantService.updateExpiredReservations();
      } catch (error) {
        console.error('Eroare la verificarea rezervărilor expirate:', error);
      }
    };
    
    checkExpiredReservations();
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      const checkExpiredReservations = async () => {
        try {
          console.log('Verificare rezervări expirate la revenirea în pagina de rezervări...');
          await RestaurantService.updateExpiredReservations();
        } catch (error) {
          console.error('Eroare la verificarea rezervărilor expirate:', error);
        }
      };
      
      checkExpiredReservations();
      return () => {};
    }, [])
  );

  useEffect(() => {
    const fetchReviewed = async () => {
      const allReviews = await Promise.all(pastReservations.map(r => ReviewService.getReviewsForRestaurant(r.restaurantId)));
      const reviewed = pastReservations.filter((r, idx) => allReviews[idx].some(rv => rv.reservation_id === r.id)).map(r => r.id);
      setReviewedReservations(reviewed);
    };
    if (activeTab === 'past' && pastReservations.length > 0) fetchReviewed();
  }, [activeTab, pastReservations]);

  const handleCancelReservation = async (id: string) => {
    try {
      await cancelReservation(id);
    } catch (error) {
      console.error('Eroare la anularea rezervării:', error);
    }
  };

  const formatDate = (reservationTime: string) => {
    return new Date(reservationTime).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Bucharest'
    });
  };

  const formatTime = (reservationTime: string) => {
    return new Date(reservationTime).toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Bucharest'
    });
  };

  const renderReservationCard = (reservation: any) => (
    <View key={reservation.id} style={[styles.reservationCard, { backgroundColor: theme.colors.card }]}>
      <Image
        source={{ uri: reservation.restaurantImage }}
        style={styles.restaurantImage}
      />
      <View style={styles.reservationInfo}>
        <Text style={[styles.restaurantName, { color: theme.colors.text }]}>
          {reservation.restaurantName}
        </Text>
        <View style={styles.detailsRow}>
          <IconSymbol name="calendar" size={16} color={theme.colors.primary} />
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            {formatDate(reservation.reservationTime)}
          </Text>
        </View>
        <View style={styles.detailsRow}>
          <IconSymbol name="person.2.fill" size={16} color={theme.colors.primary} />
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            {reservation.guests} {reservation.guests === 1 ? 'persoană' : 'persoane'}
          </Text>
        </View>
        <View style={styles.detailsRow}>
          <IconSymbol name="clock" size={16} color={theme.colors.primary} />
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            {formatTime(reservation.reservationTime)}
          </Text>
        </View>
        {activeTab === 'upcoming' && reservation.status === 'pending' && (
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.colors.notification }]}
            onPress={() => handleCancelReservation(reservation.id)}
          >
            <Text style={styles.cancelButtonText}>Anulează rezervarea</Text>
          </TouchableOpacity>
        )}
        {reservation.status === 'confirmed' && (
          <>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.statusText}>Confirmată</Text>
            </View>
            {activeTab === 'upcoming' && (
              <TouchableOpacity
                style={[styles.cancelButtonLarge, { backgroundColor: '#FF0000' }]}
                onPress={() => handleCancelReservation(reservation.id)}
              >
                <Text style={styles.cancelButtonText}>Anulează rezervarea</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {reservation.status === 'cancelled' && (
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.notification }]}>
            <Text style={styles.statusText}>Anulată</Text>
          </View>
        )}
        {reservation.status === 'completed' && (
          <>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.statusText}>Completată</Text>
            </View>
            {!reviewedReservations.includes(reservation.id) && (
              <TouchableOpacity
                style={[styles.cancelButtonLarge, { backgroundColor: theme.colors.primary, marginTop: 8 }]}
                onPress={() => router.push(`/reservation/${reservation.id}/review`)}
              >
                <Text style={styles.cancelButtonText}>Lasă recenzie</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Rezervările mele</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'upcoming' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'upcoming' ? theme.colors.primary : theme.colors.text }
            ]}
          >
            Viitoare
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'past' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'past' ? theme.colors.primary : theme.colors.text }
            ]}
          >
            Istoric
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom }]}
      >
        {activeTab === 'upcoming' ? (
          upcomingReservations.length > 0 ? (
            upcomingReservations.map(renderReservationCard)
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="calendar" size={48} color={theme.colors.placeholder} />
              <Text style={[styles.emptyStateText, { color: theme.colors.placeholder }]}>
                Nu ai rezervări viitoare
              </Text>
            </View>
          )
        ) : (
          pastReservations.length > 0 ? (
            pastReservations.map(renderReservationCard)
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="calendar" size={48} color={theme.colors.placeholder} />
              <Text style={[styles.emptyStateText, { color: theme.colors.placeholder }]}>
                Nu ai rezervări în istoric
              </Text>
            </View>
          )
        )}
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  reservationCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  restaurantImage: {
    width: 100,
    height: 100,
  },
  reservationInfo: {
    flex: 1,
    padding: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonLarge: {
    marginTop: 8,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    width: '100%',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statusBadge: {
    marginTop: 8,
    padding: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
  },
}); 