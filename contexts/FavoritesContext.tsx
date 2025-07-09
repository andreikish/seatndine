import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (restaurantId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) {
      Alert.alert('Eroare', 'Trebuie să fii autentificat pentru a vedea favoritele');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('restaurant_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Eroare Supabase:', error);
        throw new Error(error.message);
      }

      const favoriteIds = data?.map(item => item.restaurant_id) || [];
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Eroare la încărcarea favoritelor:', error);
      Alert.alert('Eroare', 'Nu am putut încărca favoritele. Te rugăm să încerci din nou.');
    }
  };

  const toggleFavorite = async (restaurantId: string) => {
    if (!user) {
      Alert.alert('Eroare', 'Trebuie să fii autentificat pentru a adăuga la favorite');
      return;
    }

    try {
      const isFavorite = favorites.includes(restaurantId);

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', restaurantId);

        if (error) {
          console.error('Eroare Supabase la ștergere:', error);
          throw new Error(error.message);
        }

        setFavorites(prev => prev.filter(id => id !== restaurantId));
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([
            { user_id: user.id, restaurant_id: restaurantId }
          ]);

        if (error) {
          console.error('Eroare Supabase la inserare:', error);
          throw new Error(error.message);
        }

        setFavorites(prev => [...prev, restaurantId]);
      }
    } catch (error) {
      console.error('Eroare detaliată la actualizarea favoritelor:', error);
      Alert.alert(
        'Eroare',
        error instanceof Error 
          ? error.message 
          : 'A apărut o eroare la actualizarea favoritelor. Te rugăm să încerci din nou.'
      );
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites trebuie folosit în interiorul unui FavoritesProvider');
  }
  return context;
} 