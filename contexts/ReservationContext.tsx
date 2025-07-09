import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Restaurant } from '@/types/restaurant';
import { NotificationService } from '@/services/NotificationService';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { RestaurantService } from '@/services/RestaurantService';

export interface Reservation {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  reservationTime: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  tableId?: string;
  tableLocation?: 'interior' | 'exterior';
  preferredLocation?: 'interior' | 'exterior';
}

interface ReservationContextType {
  reservations: Reservation[];
  loading: boolean;
  addReservation: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'> & { status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' }) => Promise<Reservation>;
  updateReservation: (id: string, updates: Partial<Reservation>) => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  getReservationById: (id: string) => Reservation | undefined;
  getUpcomingReservations: () => Reservation[];
  getPastReservations: () => Reservation[];
  clearReservations: () => Promise<void>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReservations();
    }
  }, [user]);

  const loadReservations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*, restaurant:restaurant_id (name, image)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      console.log(`Încărcare rezervări: ${data?.length || 0} rezervări găsite pentru utilizatorul ${user.id}`);
      if (data && data.length > 0) {
        console.log('Detalii prima rezervare:', JSON.stringify({
          id: data[0].id,
          tableId: data[0].table_id,
          tableLocation: data[0].table_location,
          preferredLocation: data[0].preferred_location
        }, null, 2));
      }
      
      setReservations(
        (data || []).map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          restaurantId: r.restaurant_id,
          restaurantName: r.restaurant?.name || '',
          restaurantImage: r.restaurant?.image || '',
          reservationTime: r.reservation_time,
          guests: r.guests,
          status: r.status,
          specialRequests: r.special_requests,
          createdAt: r.created_at,
          updatedAt: r.updated_at || r.created_at,
          tableId: r.table_id,
          tableLocation: r.table_location,
          preferredLocation: r.preferred_location
        }))
      );
    } catch (err) {
      console.error('Eroare la încărcarea rezervărilor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saveReservations = async () => {
      try {
        await AsyncStorage.setItem('reservations', JSON.stringify(reservations));
      } catch (error) {
        console.error('Error saving reservations:', error);
      }
    };

    if (reservations.length > 0) {
      saveReservations();
    }
  }, [reservations]);

  useEffect(() => {
    const scheduleNotifications = async () => {
      console.log('Verificare rezervări pentru programarea notificărilor:', reservations.length);
      let programate = 0;
      
      reservations.forEach((r, idx) => {
        console.log(`Rezervare [${idx}]: ID=${r.id}, Restaurant=${r.restaurantName}, Status=${r.status}, Data=${r.reservationTime}, ISO=${new Date(r.reservationTime).toISOString()}`);
      });
      
      for (const reservation of reservations) {
        if (reservation.status === 'confirmed') {
          const reservationDateTime = new Date(reservation.reservationTime);
          console.log(`Procesez rezervare confirmată: ID=${reservation.id}, Data și ora: ${reservationDateTime.toLocaleString()}, ISO=${reservationDateTime.toISOString()}`);
          
          if (reservationDateTime > new Date()) {
            try {
              console.log(`Programez notificări pentru rezervarea ${reservation.id} la ${reservation.restaurantName} pentru ${reservationDateTime.toLocaleString()}`);
              await NotificationService.scheduleReservationReminder(
                reservation.id,
                reservation.restaurantName,
                reservationDateTime
              );
              programate++;
            } catch (error) {
              console.error(`Eroare la programarea notificărilor pentru rezervarea ${reservation.id}:`, error);
            }
          } else {
            console.log(`Rezervarea ${reservation.id} este în trecut (${reservationDateTime.toLocaleString()}), nu se programează notificări`);
          }
        } else {
          console.log(`Rezervarea ${reservation.id} nu este confirmată (status: ${reservation.status}), nu se programează notificări`);
        }
      }
      
      console.log(`S-au programat notificări pentru ${programate} rezervări din total ${reservations.length}`);
      
      try {
        const notifs = await NotificationService.getScheduledNotifications();
        console.log(`Total notificări programate în sistem: ${notifs.length}`);
      } catch (err) {
        console.error('Eroare la verificarea notificărilor programate:', err);
      }
    };

    scheduleNotifications();
  }, [reservations]);

  const addReservation = async (reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'> & { status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' }): Promise<Reservation> => {
    if (!user) return Promise.reject('User not authenticated');
    try {
      console.log(`Verificare disponibilitate masă pentru rezervare: Locație preferată=${reservationData.preferredLocation || 'nicio preferință'}, Persoane=${reservationData.guests}`);
      
      const tableCheck = await RestaurantService.handleReservation(
        reservationData.restaurantId,
        reservationData.guests,
        reservationData.preferredLocation,
        reservationData.reservationTime
      );

      console.log('Rezultat verificare masă:', tableCheck);
      console.log(`DEBUG REZERVARE: Număr persoane=${reservationData.guests}, Masă alocată ID=${tableCheck.tableId}, Locație=${tableCheck.location}`);

      if (!tableCheck.success) {
        return Promise.reject(tableCheck.message);
      }

      console.log(`Masă găsită pentru rezervare: ID=${tableCheck.tableId}, Locație=${tableCheck.location}`);

      if (tableCheck.tableId && tableCheck.location) {
        const { data: restaurantData, error: getError } = await supabase
          .from('restaurants')
          .select('tables')
          .eq('id', reservationData.restaurantId)
          .single();
        
        if (getError || !restaurantData) {
          console.error('Eroare la obținerea datelor despre restaurant:', getError);
          return Promise.reject('Eroare la verificarea disponibilității mesei. Vă rugăm să încercați din nou.');
        }
        
        const location = tableCheck.location as 'interior' | 'exterior';
        if (!restaurantData.tables || 
            !Array.isArray(restaurantData.tables[location])) {
          console.error('Structură de tables invalidă sau array-ul pentru locație nu există');
          return Promise.reject('Configurație invalid de mese în restaurant. Vă rugăm să încercați din nou.');
        }
        
        const table = restaurantData.tables[location].find(
          (t: any) => t.id === tableCheck.tableId
        );
        
        if (!table || !table.isAvailable) {
          console.error(`Masa ${tableCheck.tableId} din ${tableCheck.location} nu mai este disponibilă`);
          return Promise.reject('Masa selectată nu mai este disponibilă. Vă rugăm să încercați din nou.');
        }
        console.log(`Actualizare forțată a disponibilității mesei la OCUPAT (false)...`);
        
        const updateResult = await RestaurantService.updateTableAvailability(
          reservationData.restaurantId,
          location,
          tableCheck.tableId,
          false 
        );
        
        if (!updateResult) {
          console.error(`Eroare critică la actualizarea disponibilității mesei ${tableCheck.tableId} din ${location}`);
          return Promise.reject('Eroare la rezervarea mesei. Vă rugăm să încercați din nou.');
        }
        
        const { data: checkData } = await supabase
          .from('restaurants')
          .select('tables')
          .eq('id', reservationData.restaurantId)
          .single();
          
        if (checkData && checkData.tables && Array.isArray(checkData.tables[location])) {
          const checkedTable = checkData.tables[location].find(t => t.id === tableCheck.tableId);
          if (checkedTable) {
            console.log(`Stare masă după actualizare forțată: isAvailable=${checkedTable.isAvailable}`);
            
            if (checkedTable.isAvailable === true) {
              console.error(`AVERTISMENT CRITIC: Masa este încă marcată ca disponibilă în baza de date!`);
              await RestaurantService.updateTableAvailability(
                reservationData.restaurantId,
                location,
                tableCheck.tableId,
                false
              );
            }
          }
        }
        
        console.log(`Masa ${tableCheck.tableId} din ${location} a fost marcată ca ocupată cu succes`);
      }

      console.log(`Crearea rezervării în baza de date...`);
      const dateObj = new Date(reservationData.reservationTime);
      const { data, error } = await supabase
        .from('reservations')
        .insert([
          {
            user_id: user.id,
            restaurant_id: reservationData.restaurantId,
            reservation_time: dateObj.toISOString(),
            guests: reservationData.guests,
            status: 'confirmed',
            special_requests: reservationData.specialRequests || null,
            table_id: tableCheck.tableId,
            table_location: tableCheck.location,
            preferred_location: reservationData.preferredLocation
          }
        ])
        .select('*, restaurant:restaurant_id (name, image)')
        .single();
      if (error) throw error;
      
      const newReservation: Reservation = {
        id: data.id,
        userId: data.user_id,
        restaurantId: data.restaurant_id,
        restaurantName: data.restaurant?.name || '',
        restaurantImage: data.restaurant?.image || '',
        reservationTime: data.reservation_time,
        guests: data.guests,
        status: data.status,
        specialRequests: data.special_requests,
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at,
        tableId: data.table_id,
        tableLocation: data.table_location,
        preferredLocation: data.preferred_location
      };
      
      console.log(`Rezervare creată cu succes: ID=${newReservation.id}, Masă=${newReservation.tableId}, Locație=${newReservation.tableLocation}`);
      
      if (newReservation.tableId && newReservation.tableLocation) {
        console.log(`Programăm disponibilitatea mesei ${newReservation.tableId} din ${newReservation.tableLocation} pentru rezervarea ${newReservation.id}`);
        
        try {
          const scheduleResult = await RestaurantService.scheduleTableAvailability(
            newReservation.restaurantId,
            newReservation.tableLocation,
            newReservation.tableId,
            newReservation.reservationTime,
            newReservation.id
          );
          
          if (scheduleResult) {
            console.log(`Programarea disponibilității mesei a fost realizată cu succes`);
          } else {
            console.error(`Eroare la programarea disponibilității mesei`);
          }
        } catch (scheduleError) {
          console.error('Eroare la programarea disponibilității mesei:', scheduleError);
        }
      }
      
      setReservations(prev => [newReservation, ...prev]);
      
      await NotificationService.notifyRestaurant(
        reservationData.restaurantId,
        'Nouă rezervare',
        `Rezervare nouă pentru ${reservationData.guests} persoane la ${newReservation.restaurantName} la ${new Date(data.reservation_time).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' })}`
      );
      
      return newReservation;
    } catch (err) {
      console.error('Eroare la adăugarea rezervării:', err);
      return Promise.reject('Eroare la adăugarea rezervării');
    }
  };

  const updateReservation = async (id: string, updates: Partial<Reservation>): Promise<void> => {
    if (!user) return;
    try {
      const updateObj: any = {};
      if (updates.reservationTime) {
        updateObj.reservation_time = new Date(updates.reservationTime).toISOString();
      }
      if (updates.guests !== undefined) updateObj.guests = updates.guests;
      if (updates.status) updateObj.status = updates.status;
      if (updates.specialRequests !== undefined) updateObj.special_requests = updates.specialRequests;
      const { data, error } = await supabase
        .from('reservations')
        .update(updateObj)
        .eq('id', id)
        .select('*, restaurant:restaurant_id (name, image)')
        .single();
      if (error) throw error;
      setReservations(prev =>
        prev.map(res =>
          res.id === id
            ? {
                ...res,
                ...updates,
                reservationTime: data.reservation_time,
                updatedAt: data.updated_at || new Date().toISOString(),
              }
            : res
        )
      );
      if (updates.reservationTime || updates.status) {
        const reservation = reservations.find(r => r.id === id);
        if (reservation) {
          await NotificationService.cancelReservationReminders(id);
          const updatedReservation = { ...reservation, ...updates };
          const reservationDateTime = new Date(updatedReservation.reservationTime);
          if (reservationDateTime > new Date()) {
            try {
              await NotificationService.scheduleReservationReminder(
                id,
                updatedReservation.restaurantName,
                reservationDateTime
              );
              await NotificationService.sendReservationModification(
                updatedReservation.restaurantName,
                reservationDateTime
              );
            } catch (error) {
              console.error('Error rescheduling notifications:', error);
            }
          }
        }
      }
    } catch (err) {
      console.error('Eroare la actualizarea rezervării:', err);
    }
  };

  const cancelReservation = async (id: string): Promise<void> => {
    const reservation = getReservationById(id);
    if (!reservation) return;

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;

      setReservations(prev =>
        prev.map(res =>
          res.id === id
            ? { ...res, status: 'cancelled', updatedAt: new Date().toISOString() }
            : res
        )
      );

      if (reservation.tableId && reservation.tableLocation) {
        console.log(`Eliberare masă la anularea rezervării: RestaurantID=${reservation.restaurantId}, Locație=${reservation.tableLocation}, MasaID=${reservation.tableId}`);
        
        const updateResult = await RestaurantService.updateTableAvailability(
          reservation.restaurantId,
          reservation.tableLocation,
          reservation.tableId,
          true
        );
        
        if (!updateResult) {
          console.error(`Eroare la eliberarea mesei ${reservation.tableId} din ${reservation.tableLocation}`);
        } else {
          console.log(`Masa ${reservation.tableId} din ${reservation.tableLocation} a fost eliberată cu succes`);
        }
      } else {
        console.log('Nu s-a putut elibera masa: lipsește tableId sau tableLocation', reservation);
      }

      await NotificationService.cancelReservationReminders(id);
    } catch (error) {
      console.error('Eroare la anularea rezervării:', error);
    }
  };

  const getReservationById = (id: string): Reservation | undefined => {
    return reservations.find(res => res.id === id);
  };

  const getUpcomingReservations = () => {
    const now = new Date();
    return reservations
      .filter(
        res =>
          new Date(res.reservationTime) > now &&
          (res.status === 'confirmed' || res.status === 'pending')
      )
      .sort((a, b) => new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime());
  };

  const getPastReservations = () => {
    const now = new Date();
    return reservations
      .filter(
        res =>
          new Date(res.reservationTime) < now ||
          res.status === 'cancelled' ||
          res.status === 'completed'
      )
      .sort((a, b) => new Date(b.reservationTime).getTime() - new Date(a.reservationTime).getTime());
  };

  const clearReservations = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('reservations');
      setReservations([]);
    } catch (error) {
      console.error('Error clearing reservations:', error);
    }
  };

  useEffect(() => {
    const checkExpiredReservations = async () => {
      console.log('Verificare automată a rezervărilor expirate...');
      try {
        await RestaurantService.updateExpiredReservations();
      } catch (error) {
        console.error('Eroare la verificarea automată a rezervărilor expirate:', error);
      }
    };

    if (reservations.length > 0) {
      checkExpiredReservations();
    }

    const intervalId = setInterval(checkExpiredReservations, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [reservations]);

  useEffect(() => {
    const applyTableSchedules = async () => {
      console.log('Aplicare programări de disponibilitate a meselor...');
      try {
        await RestaurantService.applyTableAvailabilitySchedules();
      } catch (error) {
        console.error('Eroare la aplicarea programărilor de disponibilitate a meselor:', error);
      }
    };

    applyTableSchedules();

    const intervalId = setInterval(applyTableSchedules, 3 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []); 

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        loading,
        addReservation,
        updateReservation,
        cancelReservation,
        getReservationById,
        getUpcomingReservations,
        getPastReservations,
        clearReservations,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservations() {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservations must be used within a ReservationProvider');
  }
  return context;
}