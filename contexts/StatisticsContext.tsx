import React, { createContext, useContext, useState, useEffect } from 'react';
import { RestaurantService } from '@/services/RestaurantService';
import { useReservations } from './ReservationContext';
import type { Restaurant } from '@/types/restaurant';

interface UserStatistics {
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  upcomingReservations: number;
  favoriteCuisines: { cuisine: string; count: number }[];
  mostVisitedRestaurants: { id: string; name: string; count: number; image?: string }[];
  favoritePriceRanges: { range: string; count: number }[];
  totalSpent: number;
}

interface StatisticsContextType {
  userStatistics: UserStatistics | null;
  loading: boolean;
  error: string | null;
  refreshStatistics: () => Promise<void>;
}

const StatisticsContext = createContext<StatisticsContextType | undefined>(undefined);

export const StatisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userStatistics, setUserStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { reservations } = useReservations();

  useEffect(() => {
    loadStatistics();
  }, [reservations]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const restaurants = await RestaurantService.getAllRestaurants();
      
      const totalReservations = reservations.length;
      console.log('Total rezervări:', totalReservations);

      const completedReservations = reservations.filter(r => {
        const reservationDate = new Date(r.reservationTime);
        const now = new Date();
        return reservationDate < now && r.status !== 'cancelled';
      }).length;

      console.log('Rezervări finalizate:', completedReservations);

      const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length;
      const upcomingReservations = reservations.filter(r => {
        const reservationDate = new Date(r.reservationTime);
        return reservationDate >= new Date() && (r.status === 'confirmed' || r.status === 'pending');
      }).length;

      const cuisineCount = reservations.reduce((acc: { [key: string]: number }, r) => {
        if (r.status !== 'completed') return acc;
        const restaurant = restaurants.find(rest => rest.id === r.restaurantId);
        if (restaurant) {
          acc[restaurant.cuisine] = (acc[restaurant.cuisine] || 0) + 1;
        }
        return acc;
      }, {});

      const favoriteCuisines = Object.entries(cuisineCount)
        .map(([cuisine, count]) => ({ cuisine, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const restaurantCount = reservations.reduce((acc: { [key: string]: { name: string; count: number; image?: string } }, r) => {
        if (r.status !== 'completed') return acc;
        const restaurant = restaurants.find(rest => rest.id === r.restaurantId);
        if (restaurant) {
          if (!acc[restaurant.id]) {
            acc[restaurant.id] = { name: restaurant.name, count: 0, image: restaurant.image };
          }
          acc[restaurant.id].count++;
        }
        return acc;
      }, {});

      const mostVisitedRestaurants = Object.entries(restaurantCount)
        .map(([id, data]) => ({ id, name: data.name, count: data.count, image: data.image }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const priceRangeCount = reservations.reduce((acc: { [key: string]: number }, r) => {
        if (r.status !== 'completed') return acc;
        const restaurant = restaurants.find(rest => rest.id === r.restaurantId);
        if (restaurant) {
          acc[restaurant.priceRange] = (acc[restaurant.priceRange] || 0) + 1;
        }
        return acc;
      }, {});

      const favoritePriceRanges = Object.entries(priceRangeCount)
        .map(([range, count]) => ({ range, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      let totalCompleted = 0;
      let countByPriceRange: Record<'$' | '$$' | '$$$', number> = { '$': 0, '$$': 0, '$$$': 0 };
      let restaurantDetails: { [key: string]: { name: string, priceRange: string, count: number } } = {};
      
      const totalSpent = reservations.reduce((acc, r) => {
        const restaurant = restaurants.find(rest => rest.id === r.restaurantId);
        
        if (restaurant && r.status === 'completed') {
          const priceValue = restaurant.priceRange === '$$$' ? 200 : 
                           restaurant.priceRange === '$$' ? 100 : 50;
          
          if (restaurant.priceRange in countByPriceRange) {
            countByPriceRange[restaurant.priceRange as '$' | '$$' | '$$$']++;
          }
          
          if (!restaurantDetails[restaurant.id]) {
            restaurantDetails[restaurant.id] = {
              name: restaurant.name,
              priceRange: restaurant.priceRange,
              count: 0
            };
          }
          restaurantDetails[restaurant.id].count++;

          totalCompleted++;

          return acc + priceValue;
        }
        return acc;
      }, 0);

      setUserStatistics({
        totalReservations,
        completedReservations,
        cancelledReservations,
        upcomingReservations,
        favoriteCuisines,
        mostVisitedRestaurants,
        favoritePriceRanges,
        totalSpent
      });
    } catch (err) {
      setError('Eroare la încărcarea statisticilor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatistics = async () => {
    await loadStatistics();
  };

  return (
    <StatisticsContext.Provider value={{
      userStatistics,
      loading,
      error,
      refreshStatistics
    }}>
      {children}
    </StatisticsContext.Provider>
  );
};

export const useStatistics = () => {
  const context = useContext(StatisticsContext);
  if (context === undefined) {
    throw new Error('useStatistics trebuie folosit în interiorul unui StatisticsProvider');
  }
  return context;
}; 