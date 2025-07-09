import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AnimatedPage } from '@/components/animated';
import { restaurantService } from '@/services/RestaurantService';
import type { Reservation } from '@/types/reservation';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function RestaurantCalendarScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const loadReservations = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      const reservations = await restaurantService.getRestaurantReservations(
        id as string,
        start,
        end
      );
      setReservations(reservations);
    } catch (error) {
      setError('Nu s-au putut încărca rezervările. Vă rugăm să încercați din nou.');
    } finally {
      setLoading(false);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const getReservationsForDate = (date: Date) => {
    return reservations.filter(reservation => 
      isSameDay(new Date(reservation.date), date)
    );
  };

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <TouchableOpacity onPress={handlePreviousMonth} style={styles.monthButton}>
        <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      
      <Text style={[styles.monthText, { color: theme.colors.text }]}>
        {format(currentDate, 'MMMM yyyy', { locale: ro })}
      </Text>
      
      <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
        <IconSymbol name="chevron.right" size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderCalendarDays = () => {
    const days = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];
    return (
      <View style={styles.weekDaysContainer}>
        {days.map((day, index) => (
          <Text key={index} style={[styles.weekDay, { color: theme.colors.text }]}>
            {day}
          </Text>
        ))}
      </View>
    );
  };

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <View style={styles.calendarGrid}>
        {days.map((day, index) => {
          const dayReservations = getReservationsForDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isToday(day) && styles.todayCell,
                isSelected && styles.selectedCell,
                { backgroundColor: theme.colors.card }
              ]}
              onPress={() => handleDateSelect(day)}
            >
              <Text style={[
                styles.dayText,
                { color: theme.colors.text },
                !isSameMonth(day, currentDate) && styles.otherMonthDay,
                isToday(day) && styles.todayText
              ]}>
                {format(day, 'd')}
              </Text>
              
              {dayReservations.length > 0 && (
                <View style={styles.reservationIndicator}>
                  <Text style={[styles.reservationCount, { color: theme.colors.primary }]}>
                    {dayReservations.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderSelectedDateReservations = () => {
    if (!selectedDate) return null;

    const dayReservations = getReservationsForDate(selectedDate);

    return (
      <View style={[styles.reservationsContainer, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.reservationsTitle, { color: theme.colors.text }]}>
          Rezervări pentru {format(selectedDate, 'd MMMM yyyy', { locale: ro })}
        </Text>
        
        {dayReservations.length === 0 ? (
          <Text style={[styles.noReservations, { color: theme.colors.placeholder }]}>
            Nu există rezervări pentru această zi
          </Text>
        ) : (
          dayReservations.map((reservation, index) => (
            <View key={index} style={styles.reservationItem}>
              <View style={styles.reservationTime}>
                <IconSymbol name="clock" size={16} color={theme.colors.primary} />
                <Text style={[styles.reservationTimeText, { color: theme.colors.text }]}>
                  {format(new Date(reservation.date), 'HH:mm')}
                </Text>
              </View>
              
              <View style={styles.reservationDetails}>
                <Text style={[styles.reservationName, { color: theme.colors.text }]}>
                  {reservation.userName}
                </Text>
                <Text style={[styles.reservationGuests, { color: theme.colors.placeholder }]}>
                  {reservation.guests} persoane • Masa {reservation.tableId}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <AnimatedPage type="fadeIn">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.card }]} 
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Calendar Rezervări
          </Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderCalendarHeader()}
          {renderCalendarDays()}
          {renderCalendarGrid()}
          {renderSelectedDateReservations()}
        </ScrollView>
      </SafeAreaView>
    </AnimatedPage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  weekDay: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 2,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  selectedCell: {
    backgroundColor: '#007AFF20',
  },
  dayText: {
    fontSize: 16,
  },
  otherMonthDay: {
    opacity: 0.5,
  },
  todayText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  reservationIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#007AFF20',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reservationCount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  reservationsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  reservationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noReservations: {
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 16,
  },
  reservationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
  },
  reservationTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  reservationTimeText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  reservationDetails: {
    flex: 1,
  },
  reservationName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  reservationGuests: {
    fontSize: 14,
  },
}); 