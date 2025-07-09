import React, { createContext, useContext, useState, useEffect } from 'react';
import { RestaurantService } from '@/services/RestaurantService';
import type { Restaurant } from '@/types/restaurant';

interface RecommendationContextType {
  recommendedRestaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  refreshRecommendations: () => Promise<void>;
}

const RecommendationContext = createContext<RecommendationContextType | undefined>(undefined);

export const RecommendationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recommendedRestaurants, setRecommendedRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const restaurants = await RestaurantService.getRecommendedRestaurants(6);
      setRecommendedRestaurants(restaurants);
    } catch (err) {
      setError('Eroare la încărcarea recomandărilor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    await loadRecommendations();
  };

  return (
    <RecommendationContext.Provider value={{
      recommendedRestaurants,
      loading,
      error,
      refreshRecommendations
    }}>
      {children}
    </RecommendationContext.Provider>
  );
};

export const useRecommendations = () => {
  const context = useContext(RecommendationContext);
  if (context === undefined) {
    throw new Error('useRecommendations trebuie folosit în interiorul unui RecommendationProvider');
  }
  return context;
}; 