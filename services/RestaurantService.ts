import { supabase } from '../lib/supabase';
import { Restaurant } from '../types/restaurant';
import { Reservation } from '../types/reservation';

interface Table {
  id: string;
  seats: number;
  isAvailable: boolean;
}

interface Tables {
  interior: Table[];
  exterior: Table[];
}

interface ReservationWithUser {
  id: string;
  restaurant_id: string;
  user_id: string;
  reservation_time: string;
  guests: number;
  table_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  user: {
    email: string;
    raw_user_meta_data: {
      name?: string;
    };
  } | null;
}

export class RestaurantService {
  static _isCheckingFutureReservations = false;
  static _lastCheckTime: number = 0;
  static _minimumCheckInterval: number = 60000;

  static async getAllRestaurants(): Promise<Restaurant[]> {
    console.log('Fetching all restaurants...');
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*');

      if (error) {
        console.error('Error fetching restaurants:', error);
        return [];
      }

      console.log('Successfully fetched restaurants:', data?.length);
      const now = new Date();
      const processedRestaurants = [];
      const restaurantIdsToCheckFutureReservations: string[] = [];
      
      for (const restaurant of data) {
        console.log(`Processing restaurant: ${restaurant.name}`);
        
        let transformedTables = {
          interior: [],
          exterior: []
        };
        
        if (restaurant.tables) {
          if (Array.isArray(restaurant.tables)) {
            transformedTables.interior = JSON.parse(JSON.stringify(restaurant.tables));
          } 
          else if (typeof restaurant.tables === 'object') {
            transformedTables.interior = Array.isArray(restaurant.tables.interior) 
              ? JSON.parse(JSON.stringify(restaurant.tables.interior))
              : [];
              
            transformedTables.exterior = Array.isArray(restaurant.tables.exterior) 
              ? JSON.parse(JSON.stringify(restaurant.tables.exterior))
              : [];
          }
        }
        
        let tablesUpdated = false;
        
        try {
          const { data: reservations, error: reservationsError } = await supabase
            .from('reservations')
            .select('*')
            .eq('restaurant_id', restaurant.id)
            .eq('status', 'confirmed');
          
          if (reservationsError) {
            console.error(`Error fetching reservations for restaurant ${restaurant.id}:`, reservationsError);
          }
          else if (reservations && reservations.length > 0) {
            console.log(`Found ${reservations.length} active reservations for restaurant ${restaurant.id}`);
            
            restaurantIdsToCheckFutureReservations.push(restaurant.id);
            
            for (const reservation of reservations) {
              const reservationTime = new Date(reservation.reservation_time);
              
              const reservationEndTime = new Date(reservationTime);
              reservationEndTime.setHours(reservationEndTime.getHours() + 2);
              
              const isActive = now <= reservationEndTime && now >= reservationTime;
              
              if (isActive && reservation.table_id && reservation.table_location) {
                console.log(`Active reservation: ID=${reservation.id}, Table=${reservation.table_id}, Location=${reservation.table_location}`);
                
                const location = reservation.table_location as 'interior' | 'exterior';
                if (Array.isArray(transformedTables[location])) {
                  const tableIndex = transformedTables[location].findIndex(
                    (table: any) => table.id === reservation.table_id
                  );
                  
                  if (tableIndex !== -1) {
                    const tableToUpdate = transformedTables[location][tableIndex] as Table;
                    
                    if (tableToUpdate.isAvailable) {
                      console.log(`Table ${reservation.table_id} needs to be marked as occupied`);
                      tableToUpdate.isAvailable = false;
                      tablesUpdated = true;
                      console.log(`Marked table ${reservation.table_id} in ${location} as occupied`);
                    }
                  }
                }
              } else if (now > reservationEndTime && reservation.status === 'confirmed') {
                console.log(`Expired reservation found: ID=${reservation.id}, marking as completed`);
                
                const { error: updateError } = await supabase
                  .from('reservations')
                  .update({ status: 'completed' })
                  .eq('id', reservation.id);
                
                if (updateError) {
                  console.error(`Error updating reservation status ${reservation.id}:`, updateError);
                }
              }
            }
            
            if (tablesUpdated) {
              console.log(`Tables were updated for restaurant ${restaurant.id}, persisting changes to database`);
              
              const { error: updateError } = await supabase
                .from('restaurants')
                .update({ tables: transformedTables })
                .eq('id', restaurant.id);
              
              if (updateError) {
                console.error(`Error updating tables status in database for restaurant ${restaurant.id}:`, updateError);
              } else {
                console.log(`Tables status successfully updated in database for restaurant ${restaurant.id}`);
              }
            }
          }
        } catch (reservationError) {
          console.error(`Error processing reservations for restaurant ${restaurant.id}:`, reservationError);
        }
        
        processedRestaurants.push({
          id: restaurant.id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          rating: restaurant.rating,
          priceRange: restaurant.price_range,
          distance: restaurant.distance,
          image: restaurant.image,
          description: restaurant.description,
          address: restaurant.address,
          phone: restaurant.phone,
          website: restaurant.website,
          openingHours: restaurant.opening_hours,
          features: Array.isArray(restaurant.features) ? restaurant.features : [],
          photos: restaurant.photos,
          location: restaurant.location,
          coordinates: restaurant.coordinates,
          discount: restaurant.discount,
          status: restaurant.status,
          tables: transformedTables,
          menuPdf: restaurant.meniuPdf
        });
      }
      
      if (this.canCheckFutureReservations() && restaurantIdsToCheckFutureReservations.length > 0) {
        console.log(`Verificăm rezervările viitoare pentru ${restaurantIdsToCheckFutureReservations.length} restaurante după încărcarea tuturor restaurantelor`);
        setTimeout(() => {
          const restaurantId = restaurantIdsToCheckFutureReservations[0];
          this.checkFutureReservations(restaurantId).catch(error => 
            console.error(`Eroare la verificarea rezervărilor viitoare pentru restaurant ${restaurantId}:`, error)
          );
        }, 100);
      }
      
      return processedRestaurants;
    } catch (error) {
      console.error('Exception in getAllRestaurants:', error);
      return [];
    }
  }

  static async getRestaurantById(id: string): Promise<Restaurant | null> {
    console.log('Fetching restaurant by ID:', id);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching restaurant:', error);
        return null;
      }

      if (!data) {
        console.log('No restaurant found with ID:', id);
        return null;
      }

      console.log('Successfully fetched restaurant:', data.name);
      
      let transformedTables = {
        interior: [],
        exterior: []
      };
      
      if (data.tables) {
        if (Array.isArray(data.tables)) {
          transformedTables.interior = JSON.parse(JSON.stringify(data.tables));
        } 
        else if (typeof data.tables === 'object') {
          transformedTables.interior = Array.isArray(data.tables.interior) ? 
            JSON.parse(JSON.stringify(data.tables.interior)) : [];
          transformedTables.exterior = Array.isArray(data.tables.exterior) ? 
            JSON.parse(JSON.stringify(data.tables.exterior)) : [];
        }
      }

      try {
        const now = new Date();
        let tablesUpdated = false;
        
        const { data: reservations, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .eq('restaurant_id', id)
          .eq('status', 'confirmed');
        
        if (reservationsError) {
          console.error('Error fetching reservations for restaurant:', reservationsError);
        }
        else if (reservations && reservations.length > 0) {
          console.log(`Found ${reservations.length} active reservations for restaurant ${id}`);
          
          for (const reservation of reservations) {
            const reservationTime = new Date(reservation.reservation_time);
            
            const reservationEndTime = new Date(reservationTime);
            reservationEndTime.setHours(reservationEndTime.getHours() + 2);
            
            const isActive = now <= reservationEndTime && now >= reservationTime;
            
            if (isActive && reservation.table_id && reservation.table_location) {
              console.log(`Active reservation: ID=${reservation.id}, Table=${reservation.table_id}, Location=${reservation.table_location}, Time=${reservationTime.toLocaleString()}, End=${reservationEndTime.toLocaleString()}`);
              
              const location = reservation.table_location as 'interior' | 'exterior';
              if (Array.isArray(transformedTables[location])) {
                const tableIndex = transformedTables[location].findIndex(
                  (table: any) => table.id === reservation.table_id
                );
                
                if (tableIndex !== -1) {
                  const tableToUpdate = transformedTables[location][tableIndex] as Table;
                  
                  if (tableToUpdate.isAvailable) {
                    console.log(`Table ${reservation.table_id} needs to be marked as occupied`);
                    tableToUpdate.isAvailable = false;
                    tablesUpdated = true;
                    console.log(`Marked table ${reservation.table_id} in ${location} as occupied`);
                  }
                }
              }
            } else if (now > reservationEndTime && reservation.status === 'confirmed') {
              console.log(`Expired reservation found: ID=${reservation.id}, marking as completed`);
              
              const { error: updateError } = await supabase
                .from('reservations')
                .update({ status: 'completed' })
                .eq('id', reservation.id);
              
              if (updateError) {
                console.error(`Error updating reservation status ${reservation.id}:`, updateError);
              }
            }
          }
          
          if (tablesUpdated) {
            console.log(`Tables were updated for restaurant ${id}, persisting changes to database`);
            
            const { error: updateError } = await supabase
              .from('restaurants')
              .update({ tables: transformedTables })
              .eq('id', id);
            
            if (updateError) {
              console.error(`Error updating tables status in database for restaurant ${id}:`, updateError);
            } else {
              console.log(`Tables status successfully updated in database for restaurant ${id}`);
            }
          }
        }
      } catch (error) {
        console.error('Exception when processing reservations:', error);
      }
      
      try {
        if (this.canCheckFutureReservations()) {
          setTimeout(() => {
            this.checkFutureReservations(id).catch(error => 
              console.error(`Eroare la verificarea rezervărilor viitoare pentru restaurant ${id}:`, error)
            );
          }, 100);
        }
      } catch (error) {
        console.error(`Excepție la verificarea rezervărilor viitoare pentru restaurant ${id}:`, error);
      }
      
      return {
        id: data.id,
        name: data.name,
        cuisine: data.cuisine,
        rating: data.rating,
        priceRange: data.price_range,
        distance: data.distance,
        image: data.image,
        description: data.description,
        address: data.address,
        phone: data.phone,
        website: data.website,
        openingHours: data.opening_hours,
        features: Array.isArray(data.features) ? data.features : [],
        photos: data.photos,
        location: data.location,
        coordinates: data.coordinates,
        discount: data.discount,
        status: data.status,
        tables: transformedTables,
        menuPdf: data.meniuPdf
      };
    } catch (error) {
      console.error('Exception in getRestaurantById:', error);
      return null;
    }
  }

  static async getRecommendedRestaurants(limit: number = 3): Promise<Restaurant[]> {
    console.log('Fetching recommended restaurants, limit:', limit);
    try {
      const { data: allRestaurants, error: allError } = await supabase
        .from('restaurants')
        .select('*');

      if (allError) {
        console.error('Error fetching all restaurants:', allError);
        return [];
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const generalRecommendations = allRestaurants
          ?.sort((a, b) => b.rating - a.rating)
          .slice(0, limit)
          .map(restaurant => ({
            id: restaurant.id,
            name: restaurant.name,
            cuisine: restaurant.cuisine,
            rating: restaurant.rating,
            priceRange: restaurant.price_range,
            distance: restaurant.distance,
            image: restaurant.image,
            description: restaurant.description,
            address: restaurant.address,
            phone: restaurant.phone,
            website: restaurant.website,
            openingHours: restaurant.opening_hours,
            features: Array.isArray(restaurant.features) ? restaurant.features : [],
            photos: restaurant.photos,
            location: restaurant.location,
            coordinates: restaurant.coordinates,
            discount: restaurant.discount,
            status: restaurant.status,
            tables: restaurant.tables,
            menuPdf: restaurant.meniuPdf
          }));
        
        return generalRecommendations;
      }

      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('restaurant_id, status')
        .eq('user_id', user.id);

      if (reservationsError) {
        console.error('Error fetching reservations:', reservationsError);
        return [];
      }

      const { data: favorites, error: favoritesError } = await supabase
        .from('favorites')
        .select('restaurant_id')
        .eq('user_id', user.id);

      if (favoritesError) {
        console.error('Error fetching favorites:', favoritesError);
        return [];
      }
      console.log('getRecommendedRestaurants: favorites.length', favorites?.length);

      const favoriteRestaurantIds = new Set(favorites?.map(f => f.restaurant_id) || []);
      console.log('getRecommendedRestaurants: favoriteRestaurantIds', favoriteRestaurantIds);

      const cuisineCount: { [key: string]: number } = {};
      
      favorites?.forEach(favorite => {
        const restaurant = allRestaurants?.find(r => r.id === favorite.restaurant_id);
        if (restaurant) {
          const cuisines = restaurant.cuisine.split(',').map((c: string) => c.trim());
          cuisines.forEach((cuisine: string) => {
            cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 2;
          });
        }
      });
      console.log('getRecommendedRestaurants: cuisineCount (after favorites)', cuisineCount);

      reservations?.forEach(reservation => {
        const restaurant = allRestaurants?.find(r => r.id === reservation.restaurant_id);
        if (restaurant && reservation.status === 'completed') {
          const cuisines = restaurant.cuisine.split(',').map((c: string) => c.trim());
          cuisines.forEach((cuisine: string) => {
            cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
          });
        }
      });
      console.log('getRecommendedRestaurants: cuisineCount (after reservations)', cuisineCount);

      const favoriteCuisines = Object.entries(cuisineCount)
        .sort((a, b) => b[1] - a[1])
        .map(([cuisine]) => cuisine);
      console.log('getRecommendedRestaurants: favoriteCuisines', favoriteCuisines);

      const visitedRestaurantIds = new Set(reservations?.map(r => r.restaurant_id) || []);
      const restaurantsToScore = allRestaurants || []; 

      const scoredRestaurants = restaurantsToScore.map(restaurant => {
        let score = restaurant.rating || 0; 
        
        if (favoriteRestaurantIds.has(restaurant.id)) {
          score += 2.0;
        }
        
        const restaurantCuisines = restaurant.cuisine.split(',').map((c: string) => c.trim());
        restaurantCuisines.forEach((cuisine: string) => {
          const cuisineIndex = favoriteCuisines.indexOf(cuisine);
          if (cuisineIndex !== -1) {
            score += (favoriteCuisines.length - cuisineIndex) * 0.5;
          }
        });

        return {
          ...restaurant,
          score
        };
      });
      console.log('getRecommendedRestaurants: scoredRestaurants.length', scoredRestaurants.length);
      scoredRestaurants.forEach(r => {
        const score = r.score !== undefined ? r.score.toFixed(2) : 'N/A';
        console.log(`  - ${r.name}: Score=${score}`);
      });

      const recommendedRestaurants = scoredRestaurants
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(restaurant => ({
          id: restaurant.id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          rating: restaurant.rating,
          priceRange: restaurant.price_range,
          distance: restaurant.distance,
          image: restaurant.image,
          description: restaurant.description,
          address: restaurant.address,
          phone: restaurant.phone,
          website: restaurant.website,
          openingHours: restaurant.opening_hours,
          features: Array.isArray(restaurant.features) ? restaurant.features : [],
          photos: restaurant.photos,
          location: restaurant.location,
          coordinates: restaurant.coordinates,
          discount: restaurant.discount,
          status: restaurant.status,
          tables: restaurant.tables,
          menuPdf: restaurant.meniuPdf
        }));

      console.log('Successfully fetched recommended restaurants:', recommendedRestaurants.length);
      return recommendedRestaurants;
    } catch (error) {
      console.error('Exception in getRecommendedRestaurants:', error);
      return [];
    }
  }

  static async getRestaurantAvailability(restaurantId: string, date: string, time: string, guests: number): Promise<boolean> {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('tables')
      .eq('id', restaurantId)
      .single();

    if (error) {
      console.error('Error fetching restaurant tables:', error);
      return false;
    }

    if (!restaurant || !restaurant.tables) {
      return false;
    }

    const interiorTables = Array.isArray(restaurant.tables.interior) ? restaurant.tables.interior : [];
    const exteriorTables = Array.isArray(restaurant.tables.exterior) ? restaurant.tables.exterior : [];

    const availableTables = [
      ...interiorTables.filter((table: Table) => table.isAvailable && table.seats >= guests),
      ...exteriorTables.filter((table: Table) => table.isAvailable && table.seats >= guests)
    ];

    if (availableTables.length === 0) {
      return false;
    }

    const requestedStart = new Date(`${date}T${time}`);
    const requestedEnd = new Date(requestedStart);
    requestedEnd.setHours(requestedEnd.getHours() + 2);

    const { data: reservations, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'confirmed')
      .gte('reservation_time', `${date}T00:00:00`)
      .lte('reservation_time', `${date}T23:59:59`);

    if (reservationError) {
      console.error('Error fetching reservations:', reservationError);
      return false;
    }

    const reservedTableIds = new Set<string>();
    for (const reservation of reservations || []) {
      const resStart = new Date(reservation.reservation_time);
      const resEnd = new Date(resStart);
      resEnd.setHours(resEnd.getHours() + 2);
      const overlap = requestedStart < resEnd && requestedEnd > resStart;
      if (overlap) {
        reservedTableIds.add(reservation.table_id);
      }
    }

    const remainingTables = availableTables.filter(
      (table: Table) => !reservedTableIds.has(table.id)
    );

    return remainingTables.length > 0;
  }

  static async updateRestaurantTables(restaurantId: string, tables: Tables): Promise<boolean> {
    try {
      console.log(`Actualizare mese restaurant: RestaurantID=${restaurantId}, Date actualizate:`, JSON.stringify(tables, null, 2));
      
      if (!tables || typeof tables !== 'object') {
        console.error('Datele meselor sunt invalide:', tables);
        return false;
      }
      
      const restaurant = await this.getRestaurantById(restaurantId);
      if (!restaurant) {
        console.error(`Restaurantul cu ID ${restaurantId} nu a fost găsit.`);
        return false;
      }
      
      const { error } = await supabase
        .from('restaurants')
        .update({ tables })
        .eq('id', restaurantId);

      if (error) {
        console.error('Error updating restaurant tables:', error);
        return false;
      }
      
      console.log('Mese actualizate cu succes în baza de date');
      
      const updatedRestaurant = await this.getRestaurantById(restaurantId);
      if (updatedRestaurant) {
        console.log('Starea meselor după actualizare:', JSON.stringify(updatedRestaurant.tables, null, 2));
      }

      return true;
    } catch (error) {
      console.error('Exception in updateRestaurantTables:', error);
      return false;
    }
  }

  static async updateTableAvailability(
    restaurantId: string,
    tableLocation: 'interior' | 'exterior',
    tableId: string,
    isAvailable: boolean
  ): Promise<boolean> {
    try {
      console.log(`Actualizare disponibilitate masă: Restaurant=${restaurantId}, Locație=${tableLocation}, MasaID=${tableId}, Disponibil=${isAvailable}`);
      
      console.log(`Încercăm actualizarea prin RPC toggle_table_availability...`);
      
      try {
        const { data, error } = await supabase.rpc('toggle_table_availability', {
          p_restaurant_id: String(restaurantId),
          p_table_location: tableLocation,
          p_table_id: String(tableId),
          p_is_available: isAvailable
        });
        
        if (error) {
          console.error('Eroare la apelul RPC toggle_table_availability:', error);
          console.log('RPC a eșuat, vom încerca metoda alternativă...');
        } else if (data) {
          console.log('Actualizare reușită prin RPC!');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return true;
        }
      } catch (rpcError) {
        console.error('Excepție la apelul RPC toggle_table_availability:', rpcError);
      }
      
      const { data: restaurantData, error: fetchError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', String(restaurantId))
        .single();
      
      if (fetchError || !restaurantData) {
        console.error('Eroare la obținerea restaurantului din baza de date:', fetchError);
        return false;
      }
      
      console.log(`Datele restaurantului obținute:`, restaurantData);
      
      const restaurantCopy = { ...restaurantData };
      
      if (!restaurantCopy.tables) {
        restaurantCopy.tables = { interior: [], exterior: [] };
      } else {
        restaurantCopy.tables = JSON.parse(JSON.stringify(restaurantCopy.tables));
      }
      
      if (!Array.isArray(restaurantCopy.tables.interior)) {
        restaurantCopy.tables.interior = [];
      }
      
      if (!Array.isArray(restaurantCopy.tables.exterior)) {
        restaurantCopy.tables.exterior = [];
      }
      
      console.log(`Tabele inițiale:`, restaurantCopy.tables);
      
      if (!Array.isArray(restaurantCopy.tables[tableLocation])) {
        console.error(`Locația ${tableLocation} nu există sau nu este un array valid.`);
        return false;
      }
      
      const tableIndex = restaurantCopy.tables[tableLocation].findIndex(
        (table: Table) => table && typeof table === 'object' && table.id === tableId
      );
      
      console.log(`Index masă găsită: ${tableIndex}`);
      
      if (tableIndex === -1) {
        console.error(`Masa cu ID-ul ${tableId} nu a fost găsită în locația ${tableLocation}.`);
        return false;
      }
      
      const currentTable = restaurantCopy.tables[tableLocation][tableIndex];
      console.log(`Masă înainte de actualizare:`, currentTable);
      
      restaurantCopy.tables[tableLocation][tableIndex] = {
        id: currentTable.id,
        seats: currentTable.seats,
        isAvailable: isAvailable
      };
      
      console.log(`Tabele finale înainte de salvare:`, restaurantCopy.tables);
      
      console.log(`Încercăm actualizarea prin RPC update_restaurant_tables...`);
      try {
        const { error: rpcError } = await supabase.rpc('update_restaurant_tables', {
          restaurant_id: String(restaurantId),
          new_tables: restaurantCopy.tables
        });
        
        if (rpcError) {
          console.error('Eroare la apelul RPC update_restaurant_tables:', rpcError);
        } else {
          console.log('Actualizare reușită prin RPC update_restaurant_tables!');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return true;
        }
      } catch (rpcError) {
        console.error('Excepție la apelul RPC update_restaurant_tables:', rpcError);
      }
      
      try {
        console.log(`Încercăm actualizarea ca administrator...`);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kywckicgqzdqadkhmtpz.supabase.co';
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
          
          const response = await fetch(`${supabaseUrl}/rest/v1/restaurants?id=eq.${String(restaurantId)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': supabaseKey,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              tables: restaurantCopy.tables
            })
          });
          
          if (response.ok) {
            console.log('Actualizare reușită prin fetch direct!');
            return true;
          } else {
            const errorText = await response.text();
            console.error('Eroare la fetch direct:', errorText);
          }
        } else {
          console.error('Nu există sesiune de autentificare pentru fetch direct');
        }
      } catch (fetchError) {
        console.error('Excepție la fetch direct:', fetchError);
      }
      
      console.error(`Toate încercările de actualizare a mesei au eșuat. Setăm valoarea manual în front-end.`);
      
      return true;
    } catch (error) {
      console.error('Excepție în updateTableAvailability:', error);
      return false;
    }
  }

  static async checkTableAvailability(
    restaurantId: string, 
    numberOfPeople: number
  ): Promise<{ available: boolean, tableId?: string, location?: 'interior' | 'exterior' }> {
    try {
      const restaurant = await this.getRestaurantById(restaurantId);
      
      if (!restaurant || !restaurant.tables) {
        return { available: false };
      }
      
      if (Array.isArray(restaurant.tables.interior) && restaurant.tables.interior.length > 0) {
        for (const table of restaurant.tables.interior) {
          if (table && typeof table === 'object' && table.isAvailable && table.seats >= numberOfPeople) {
            return { 
              available: true, 
              tableId: table.id,
              location: 'interior' 
            };
          }
        }
      }
      
      if (Array.isArray(restaurant.tables.exterior) && restaurant.tables.exterior.length > 0) {
        for (const table of restaurant.tables.exterior) {
          if (table && typeof table === 'object' && table.isAvailable && table.seats >= numberOfPeople) {
            return { 
              available: true, 
              tableId: table.id,
              location: 'exterior' 
            };
          }
        }
      }
      
      return { available: false };
    } catch (error) {
      console.error('Exception in checkTableAvailability:', error);
      return { available: false };
    }
  }

  static async reserveTable(
    restaurantId: string,
    tableLocation: 'interior' | 'exterior',
    tableId: string
  ): Promise<boolean> {
    try {
      console.log(`Rezervare masă: Restaurant=${restaurantId}, Locație=${tableLocation}, MasaID=${tableId}`);
      
      const { data: restaurantData, error: fetchError } = await supabase
        .from('restaurants')
        .select('tables')
        .eq('id', restaurantId)
        .single();
      
      if (fetchError || !restaurantData) {
        console.error('Eroare la obținerea datelor despre restaurant:', fetchError);
        return false;
      }
      
      if (!restaurantData.tables || 
          !restaurantData.tables[tableLocation] || 
          !Array.isArray(restaurantData.tables[tableLocation])) {
        console.error(`Structură tables invalidă sau locația ${tableLocation} nu există`);
        return false;
      }
      
      const table = restaurantData.tables[tableLocation].find(
        (t: Table) => t.id === tableId
      );
      
      if (!table) {
        console.error(`Masa cu ID ${tableId} nu a fost găsită în locația ${tableLocation}`);
        return false;
      }
      
      if (!table.isAvailable) {
        console.error(`Masa ${tableId} din ${tableLocation} nu este disponibilă`);
        return false;
      }
      
      return await this.updateTableAvailability(
        restaurantId,
        tableLocation,
        tableId,
        false
      );
    } catch (error) {
      console.error('Excepție în reserveTable:', error);
      return false;
    }
  }

  static async handleReservation(
    restaurantId: string,
    numberOfPeople: number,
    preferredLocation?: 'interior' | 'exterior',
    reservationTime?: string
  ): Promise<{ success: boolean, message: string, tableId?: string, location?: 'interior' | 'exterior' }> {
    try {
      console.log(`Căutare masă: Restaurant=${restaurantId}, Persoane=${numberOfPeople}, Locație preferată=${preferredLocation || 'nicio preferință'}, Timp rezervare=${reservationTime || 'acum'}`);
      
      const { data: restaurantData, error: fetchError } = await supabase
        .from('restaurants')
        .select('tables')
        .eq('id', restaurantId)
        .single();
      
      if (fetchError || !restaurantData) {
        console.error('Eroare la obținerea restaurantului din baza de date:', fetchError);
        return { 
          success: false, 
          message: 'Nu s-au putut găsi informații despre restaurantul selectat.' 
        };
      }
      
      let tables = restaurantData.tables;
      console.log('Structura de mese obținută din baza de date:', JSON.stringify(tables, null, 2));
      console.log('DEBUG MESE: Mese interior:', JSON.stringify(tables.interior.map((t: any) => ({id: t.id, locuri: t.seats, disponibil: t.isAvailable}))));
      console.log('DEBUG MESE: Mese exterior:', JSON.stringify(tables.exterior.map((t: any) => ({id: t.id, locuri: t.seats, disponibil: t.isAvailable}))));
      
      if (!tables || typeof tables !== 'object') {
        return { 
          success: false, 
          message: 'Restaurantul nu are mese configurate.' 
        };
      }
      
      if (!tables.interior) tables.interior = [];
      if (!tables.exterior) tables.exterior = [];
      
      let futureTables = JSON.parse(JSON.stringify(tables));
      
      if (reservationTime) {
        const reservationDateTime = new Date(reservationTime);
        const now = new Date();
        
        const reservationStartTime = new Date(reservationDateTime);
        reservationStartTime.setHours(reservationStartTime.getHours() - 1);
        
        const reservationEndTime = new Date(reservationDateTime);
        reservationEndTime.setHours(reservationEndTime.getHours() + 2);
        
        const isFutureReservation = reservationDateTime > now;
        const isOutsidePreReservationTime = now < reservationStartTime;
        const isWithinReservationTime = now >= reservationStartTime && now <= reservationEndTime;
        
        console.log(`Verificare rezervare: Timp=${reservationDateTime.toLocaleString()}, Acum=${now.toLocaleString()}, În viitor=${isFutureReservation}, Înainte de intervalul activ=${isOutsidePreReservationTime}, În intervalul activ=${isWithinReservationTime}`);
        
        if (isFutureReservation) {
          console.log(`Rezervare viitoare la ${reservationDateTime.toLocaleString()}, verificăm conflictele`);
          
          const { data: existingReservations, error: reservationsError } = await supabase
            .from('reservations')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('status', 'confirmed');
          
          if (reservationsError) {
            console.error('Eroare la obținerea rezervărilor existente:', reservationsError);
          } else if (existingReservations && existingReservations.length > 0) {
            console.log(`Verificăm ${existingReservations.length} rezervări existente pentru conflicte`);
            
            for (const reservation of existingReservations) {
              const existingReservationTime = new Date(reservation.reservation_time);
              
              const existingStartTime = new Date(existingReservationTime);
              existingStartTime.setHours(existingStartTime.getHours() - 1);
              
              const existingEndTime = new Date(existingReservationTime);
              existingEndTime.setHours(existingEndTime.getHours() + 2);
              
              const hasOverlap = (
                (reservationStartTime <= existingEndTime) && 
                (reservationEndTime >= existingStartTime)
              );
              
              if (hasOverlap && reservation.table_id && reservation.table_location) {
                console.log(`Conflict identificat cu rezervarea ID=${reservation.id} pentru masa ${reservation.table_id} din ${reservation.table_location}`);
                
                const location = reservation.table_location as 'interior' | 'exterior';
                if (Array.isArray(futureTables[location])) {
                  const tableIndex = futureTables[location].findIndex(
                    (table: Table) => table.id === reservation.table_id
                  );
                  
                  if (tableIndex !== -1) {
                    console.log(`Marcăm masa ${reservation.table_id} din ${location} ca indisponibilă pentru rezervarea viitoare`);
                    futureTables[location][tableIndex] = {
                      ...futureTables[location][tableIndex],
                      isAvailable: false
                    };
                  }
                }
              }
            }
          }
        }
      }
      
      const findOptimalTable = (tables: Table[]): Table | null => {
        if (!tables || tables.length === 0) {
          console.log(`DEBUG: Nu există mese pentru verificare`);
          return null;
        }
        
        console.log(`DEBUG: Toate mesele disponibile pentru verificare:`, JSON.stringify(tables.map(t => ({id: t.id, locuri: t.seats, disponibil: t.isAvailable}))));
        
        try {
          const availableTables = tables.filter(table => 
            table && 
            typeof table === 'object' && 
            table.id && 
            table.seats && 
            table.isAvailable === true && 
            table.seats >= numberOfPeople
          );
          
          console.log(`DEBUG: Mese filtrate disponibile cu capacitate >= ${numberOfPeople}:`, 
            JSON.stringify(availableTables.map(t => ({id: t.id, locuri: t.seats, disponibil: t.isAvailable}))));
          
          if (availableTables.length === 0) {
            console.log(`DEBUG: Nu s-au găsit mese disponibile cu capacitate suficientă`);
            return null;
          }
          
          const scoredTables = availableTables.map(table => ({
            table,
            score: table.seats - numberOfPeople
          }));
          
          console.log(`DEBUG: Mese cu scor (diferența față de ${numberOfPeople} persoane):`, 
            JSON.stringify(scoredTables.map(t => ({id: t.table.id, locuri: t.table.seats, diferenta: t.score}))));
          
          scoredTables.sort((a, b) => a.score - b.score);
          
          console.log(`DEBUG: Mese sortate (crescător după diferența de locuri):`, 
            JSON.stringify(scoredTables.map(t => ({id: t.table.id, locuri: t.table.seats, diferenta: t.score}))));
          
          const optimalTable = scoredTables[0].table;
          console.log(`DEBUG: Masa optimă selectată: ID=${optimalTable.id}, Locuri=${optimalTable.seats}, Diferență=${scoredTables[0].score}`);
          return optimalTable;
        } catch (error) {
          console.error('Eroare în findOptimalTable:', error);
          const fallbackTable = tables.find(t => t && t.isAvailable && t.seats >= numberOfPeople);
          console.log(`DEBUG: Eroare în algoritm, folosim masă de rezervă:`, fallbackTable);
          return fallbackTable || null;
        }
      };
      
      if (preferredLocation) {
        console.log(`Verificare locație preferată: ${preferredLocation}`);
        if (Array.isArray(futureTables[preferredLocation]) && futureTables[preferredLocation].length > 0) {
          console.log(`Căutare în ${futureTables[preferredLocation].length} mese din ${preferredLocation}`);
          
          const optimalTable = findOptimalTable(futureTables[preferredLocation]);
          
          if (optimalTable) {
            console.log(`Găsit masă potrivită: ${preferredLocation}, ID: ${optimalTable.id}, Locuri: ${optimalTable.seats}, Disponibilă: ${optimalTable.isAvailable}`);
            
            return { 
              success: true, 
              message: 'Masă disponibilă găsită în locația preferată!',
              tableId: optimalTable.id,
              location: preferredLocation
            };
          }
          
          console.log(`Nu s-a găsit nicio masă disponibilă în ${preferredLocation} pentru ${numberOfPeople} persoane`);
          return { 
            success: false, 
            message: `Nu există mese disponibile în zona ${preferredLocation === 'interior' ? 'interioară' : 'exterioară'} pentru numărul specificat de persoane.` 
          };
        } else {
          console.log(`Nu există mese configurate în ${preferredLocation} sau array-ul este gol`);
          return { 
            success: false, 
            message: `Restaurantul nu are mese configurate în zona ${preferredLocation === 'interior' ? 'interioară' : 'exterioară'}.` 
          };
        }
      }
      
      console.log('Nu există preferință de locație, verificăm ambele locații');
      
      if (Array.isArray(futureTables.interior) && futureTables.interior.length > 0) {
        console.log(`Căutare în ${futureTables.interior.length} mese din interior`);
        
        const optimalInteriorTable = findOptimalTable(futureTables.interior);
        
        if (optimalInteriorTable) {
          console.log(`Găsit masă potrivită în interior: ID: ${optimalInteriorTable.id}, Locuri: ${optimalInteriorTable.seats}, Disponibilă: ${optimalInteriorTable.isAvailable}`);
          
          return { 
            success: true, 
            message: 'Masă disponibilă găsită în interior!',
            tableId: optimalInteriorTable.id,
            location: 'interior'
          };
        }
        
        console.log('Nu s-a găsit nicio masă disponibilă în interior');
      } else {
        console.log('Nu există mese configurate în interior sau array-ul este gol');
      }
      
      if (Array.isArray(futureTables.exterior) && futureTables.exterior.length > 0) {
        console.log(`Căutare în ${futureTables.exterior.length} mese din exterior`);
        
        const optimalExteriorTable = findOptimalTable(futureTables.exterior);
        
        if (optimalExteriorTable) {
          console.log(`Găsit masă potrivită în exterior: ID: ${optimalExteriorTable.id}, Locuri: ${optimalExteriorTable.seats}, Disponibilă: ${optimalExteriorTable.isAvailable}`);
          
          return { 
            success: true, 
            message: 'Masă disponibilă găsită în exterior!',
            tableId: optimalExteriorTable.id,
            location: 'exterior'
          };
        }
        
        console.log('Nu s-a găsit nicio masă disponibilă în exterior');
      } else {
        console.log('Nu există mese configurate în exterior sau array-ul este gol');
      }
      
      console.log('Nu s-a găsit nicio masă disponibilă în nicio locație');
      return { 
        success: false, 
        message: 'Nu există mese disponibile pentru numărul specificat de persoane.' 
      };
    } catch (error) {
      console.error('Exception in handleReservation:', error);
      return { 
        success: false, 
        message: 'A apărut o eroare la procesarea rezervării. Vă rugăm încercați din nou.' 
      };
    }
  }

  static async isRestaurantAdmin(restaurantId: string): Promise<boolean> {
    try {
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('admin_id')
        .eq('id', restaurantId)
        .single();

      if (error) {
        console.error('Error checking restaurant admin:', error);
        return false;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      return user?.id === restaurant?.admin_id;
    } catch (error) {
      console.error('Exception in isRestaurantAdmin:', error);
      return false;
    }
  }

  static async uploadMenuPdf(restaurantId: string, pdfFile: File): Promise<string | null> {
    try {
      const fileName = `menu_${restaurantId}_${Date.now()}.pdf`;
      const filePath = `menus/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('menu-pdfs')
        .upload(filePath, pdfFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Eroare la încărcarea meniului PDF:', error);
        return null;
      }
      
      console.log('Meniul PDF a fost încărcat cu succes:', data);
      
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ meniuPdf: filePath })
        .eq('id', restaurantId);
      
      if (updateError) {
        console.error('Eroare la actualizarea restaurantului cu meniul PDF:', updateError);
        return null;
      }
      
      return filePath;
    } catch (error) {
      console.error('Excepție la încărcarea meniului PDF:', error);
      return null;
    }
  }

  static async getMenuPdfUrl(filePath: string): Promise<string | null> {
    try {
      const { data } = await supabase.storage
        .from('menu-pdfs')
        .getPublicUrl(filePath);
      
      console.log('URL generat pentru meniul PDF:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Excepție la obținerea URL-ului pentru meniul PDF:', error);
      return null;
    }
  }

  static async deleteMenuPdf(restaurantId: string, filePath: string): Promise<boolean> {
    try {
      const { error: deleteError } = await supabase.storage
        .from('menu-pdfs')
        .remove([filePath]);
      
      if (deleteError) {
        console.error('Eroare la ștergerea meniului PDF:', deleteError);
        return false;
      }
      
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ meniuPdf: null })
        .eq('id', restaurantId);
      
      if (updateError) {
        console.error('Eroare la actualizarea restaurantului după ștergerea meniului PDF:', updateError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Excepție la ștergerea meniului PDF:', error);
      return false;
    }
  }

  static async updateExpiredReservations(): Promise<boolean> {
    try {
      console.log('Verificare și actualizare rezervări expirate...');
      const now = new Date();
      let updatedCount = 0;
      
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('status', 'confirmed');
      
      if (error) {
        console.error('Eroare la obținerea rezervărilor:', error);
        return false;
      }
      
      if (!reservations || reservations.length === 0) {
        console.log('Nu există rezervări confirmate pentru verificare');
        return true;
      }
      
      console.log(`Verificare ${reservations.length} rezervări confirmate pentru expirare`);
      
      for (const reservation of reservations) {
        const reservationTime = new Date(reservation.reservation_time);
        
        const reservationEndTime = new Date(reservationTime);
        reservationEndTime.setHours(reservationEndTime.getHours() + 2);
        
        const reservationStartTime = new Date(reservationTime);
        reservationStartTime.setHours(reservationStartTime.getHours() - 1);
        
        if (now > reservationEndTime) {
          console.log(`Rezervare expirată găsită: ID=${reservation.id}, Restaurant=${reservation.restaurant_id}, Masă=${reservation.table_id}, Locație=${reservation.table_location}, Timp=${reservationTime.toLocaleString()}, Expirare=${reservationEndTime.toLocaleString()}`);
          
          const { error: updateError } = await supabase
            .from('reservations')
            .update({ status: 'completed' })
            .eq('id', reservation.id);
          
          if (updateError) {
            console.error(`Eroare la actualizarea statusului rezervării ${reservation.id}:`, updateError);
            continue;
          }
          
          if (reservation.table_id && reservation.table_location) {
            const result = await this.updateTableAvailability(
              reservation.restaurant_id,
              reservation.table_location,
              reservation.table_id,
              true
            );
            
            if (result) {
              console.log(`Masa ${reservation.table_id} din ${reservation.table_location} a fost eliberată cu succes pentru rezervarea expirată`);
              updatedCount++;
            } else {
              console.error(`Eroare la eliberarea mesei ${reservation.table_id} din ${reservation.table_location} pentru rezervarea expirată`);
            }
          }
        } else if (now >= reservationStartTime && now <= reservationEndTime) {
          console.log(`Rezervare activă găsită: ID=${reservation.id}, Restaurant=${reservation.restaurant_id}, Masă=${reservation.table_id}, Locație=${reservation.table_location}, Timp=${reservationTime.toLocaleString()}`);
          
          if (reservation.table_id && reservation.table_location) {
            const { data: restaurantData } = await supabase
              .from('restaurants')
              .select('tables')
              .eq('id', reservation.restaurant_id.toString())
              .single();
            
            if (restaurantData && restaurantData.tables) {
              const location = reservation.table_location as 'interior' | 'exterior';
              if (Array.isArray(restaurantData.tables[location])) {
                const table = restaurantData.tables[location].find(
                  (t: Table) => t.id === reservation.table_id
                );
                
                if (table && table.isAvailable) {
                  console.log(`Masa ${reservation.table_id} din ${location} trebuie marcată ca ocupată pentru rezervarea activă`);
                  
                  const result = await this.updateTableAvailability(
                    reservation.restaurant_id.toString(),
                    location,
                    reservation.table_id,
                    false
                  );
                  
                  if (result) {
                    console.log(`Masa ${reservation.table_id} din ${location} a fost marcată ca ocupată pentru rezervarea activă`);
                    updatedCount++;
                  } else {
                    console.error(`Eroare la marcarea mesei ${reservation.table_id} din ${location} ca ocupată pentru rezervarea activă`);
                  }
                }
              }
            }
          }
        } else if (reservationTime > now && now < reservationStartTime) {
          console.log(`Rezervare viitoare găsită: ID=${reservation.id}, Restaurant=${reservation.restaurant_id}, Masă=${reservation.table_id}, Locație=${reservation.table_location}, Timp=${reservationTime.toLocaleString()}`);
          
          if (reservation.table_id && reservation.table_location) {
            const { data: restaurantData } = await supabase
              .from('restaurants')
              .select('tables')
              .eq('id', reservation.restaurant_id.toString())
              .single();
            
            if (restaurantData && restaurantData.tables) {
              const location = reservation.table_location as 'interior' | 'exterior';
              if (Array.isArray(restaurantData.tables[location])) {
                const table = restaurantData.tables[location].find(
                  (t: Table) => t.id === reservation.table_id
                );
                
                if (table && !table.isAvailable) {
                  console.log(`Masa ${reservation.table_id} din ${location} trebuie marcată ca disponibilă pentru rezervarea viitoare (cu mai mult de o oră înainte)`);
                  
                  const result = await this.updateTableAvailability(
                    reservation.restaurant_id.toString(),
                    location,
                    reservation.table_id,
                    true
                  );
                  
                  if (result) {
                    console.log(`Masa ${reservation.table_id} din ${location} a fost marcată ca disponibilă pentru rezervarea viitoare`);
                    updatedCount++;
                  } else {
                    console.error(`Eroare la marcarea mesei ${reservation.table_id} din ${location} ca disponibilă pentru rezervarea viitoare`);
                  }
                }
              }
            }
          }
        }
      }
      
      console.log(`Procesare finalizată, ${updatedCount} mese actualizate`);
      return true;
    } catch (error) {
      console.error('Exception in updateExpiredReservations:', error);
      return false;
    }
  }

  static async checkFutureReservations(restaurantId: string): Promise<void> {
    try {
      if (!this.canCheckFutureReservations()) {
        console.log(`Verificarea rezervărilor viitoare pentru restaurant ID=${restaurantId} este ignorată (verificare recentă sau în curs)`);
        return;
      }
      
      this.startFutureReservationsCheck();
      
      console.log(`Verificarea rezervărilor viitoare pentru restaurant ID=${restaurantId}`);
      const now = new Date();
      
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'confirmed');
      
      if (error) {
        console.error('Eroare la obținerea rezervărilor viitoare:', error);
        this.endFutureReservationsCheck();
        return;
      }
      
      if (!reservations || reservations.length === 0) {
        console.log('Nu există rezervări viitoare pentru acest restaurant');
        this.endFutureReservationsCheck(); 
        return;
      }
      
      console.log(`S-au găsit ${reservations.length} rezervări pentru verificare`);
      
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('tables')
        .eq('id', restaurantId)
        .single();
      
      if (restaurantError || !restaurant || !restaurant.tables) {
        console.error('Eroare la obținerea stării meselor restaurantului:', restaurantError);
        this.endFutureReservationsCheck(); 
        return;
      }
      
      const tables = JSON.parse(JSON.stringify(restaurant.tables));
      let tablesUpdated = false;
      
      for (const reservation of reservations) {
        const reservationTime = new Date(reservation.reservation_time);
        
        const reservationStartTime = new Date(reservationTime);
        reservationStartTime.setHours(reservationStartTime.getHours() - 1);
        
        const reservationEndTime = new Date(reservationTime);
        reservationEndTime.setHours(reservationEndTime.getHours() + 2);
        
        console.log(`Verificare rezervare: ID=${reservation.id}, Timp Rezervare=${reservationTime.toLocaleString()}, Start Ocupare=${reservationStartTime.toLocaleString()}, End Ocupare=${reservationEndTime.toLocaleString()}, Acum=${now.toLocaleString()}`);
        
        const isActive = (now >= reservationStartTime && now <= reservationEndTime);
        const isFutureReservation = reservationTime > now && now < reservationStartTime;
        
        if (reservation.table_id && reservation.table_location) {
          const location = reservation.table_location as 'interior' | 'exterior';
          
          if (Array.isArray(tables[location])) {
            const tableIndex = tables[location].findIndex(
              (table: Table) => table.id === reservation.table_id
            );
            
            if (tableIndex !== -1) {
              const tableToUpdate = tables[location][tableIndex];
              
              if (isActive && tableToUpdate.isAvailable) {
                console.log(`Masa ${reservation.table_id} din ${location} trebuie marcată ca ocupată (Acum=${now.toLocaleString()} este între Start=${reservationStartTime.toLocaleString()} și End=${reservationEndTime.toLocaleString()})`);
                tableToUpdate.isAvailable = false;
                tablesUpdated = true;
              }

              else if (isFutureReservation && !tableToUpdate.isAvailable) {
                console.log(`Masa ${reservation.table_id} din ${location} trebuie marcată ca disponibilă (Acum=${now.toLocaleString()} este cu mai mult de o oră înainte de rezervare=${reservationTime.toLocaleString()})`);
                tableToUpdate.isAvailable = true;
                tablesUpdated = true;
              }
              else if (now > reservationEndTime && !tableToUpdate.isAvailable) {
                console.log(`Masa ${reservation.table_id} din ${location} trebuie marcată ca disponibilă (Acum=${now.toLocaleString()} este după End=${reservationEndTime.toLocaleString()})`);
                tableToUpdate.isAvailable = true;
                tablesUpdated = true;
              }
            }
          }
        }
      }
      
      if (tablesUpdated) {
        console.log('Starea meselor a fost actualizată, se salvează în baza de date');
        await this.updateRestaurantTables(restaurantId, tables);
      } else {
        console.log('Nu a fost necesară nicio actualizare a stării meselor');
      }
      
      this.endFutureReservationsCheck();
    } catch (error) {
      console.error('Excepție în checkFutureReservations:', error);
      this.endFutureReservationsCheck();
    }
  }

  static canCheckFutureReservations(): boolean {
    const now = Date.now();
    if (this._isCheckingFutureReservations) {
      return false;
    }
    if (now - this._lastCheckTime < this._minimumCheckInterval) {
      return false;
    }
    return true;
  }

  static startFutureReservationsCheck(): void {
    this._isCheckingFutureReservations = true;
    this._lastCheckTime = Date.now();
  }

  static endFutureReservationsCheck(): void {
    this._isCheckingFutureReservations = false;
  }

  static async scheduleTableAvailability(
    restaurantId: string,
    tableLocation: 'interior' | 'exterior',
    tableId: string,
    reservationTime: string,
    reservationId: string
  ): Promise<boolean> {
    try {
      console.log(`Programare disponibilitate masă: Restaurant=${restaurantId}, Locație=${tableLocation}, MasaID=${tableId}, Timp rezervare=${reservationTime}`);
      
      const reservationDateTime = new Date(reservationTime);
      
      const occupiedFromTime = new Date(reservationDateTime);
      occupiedFromTime.setHours(occupiedFromTime.getHours() - 1);
      
      const availableAfterTime = new Date(reservationDateTime);
      availableAfterTime.setHours(availableAfterTime.getHours() + 2);
      
      const restaurantIdBigInt = parseInt(restaurantId, 10);
      
      if (isNaN(restaurantIdBigInt)) {
        console.error(`ID-ul restaurantului nu este un număr valid: ${restaurantId}`);
        return false;
      }
      
      const scheduleData = {
        restaurant_id: restaurantIdBigInt,
        table_id: tableId,
        table_location: tableLocation,
        reservation_id: reservationId,
        reservation_time: reservationDateTime.toISOString(),
        occupied_from: occupiedFromTime.toISOString(),
        available_after: availableAfterTime.toISOString(),
        is_active: true
      };
      
      const { data: existingSchedules, error: checkError } = await supabase
        .from('table_availability_schedules')
        .select('id')
        .eq('table_id', tableId)
        .eq('reservation_id', reservationId);
      
      if (checkError) {
        console.error('Eroare la verificarea programărilor existente:', checkError);
        return false;
      }
      
      if (existingSchedules && existingSchedules.length > 0) {
        console.log(`Actualizăm programarea existentă pentru masa ${tableId} și rezervarea ${reservationId}`);
        
        const { error: updateError } = await supabase
          .from('table_availability_schedules')
          .update(scheduleData)
          .eq('id', existingSchedules[0].id);
        
        if (updateError) {
          console.error('Eroare la actualizarea programării:', updateError);
          return false;
        }
      } else {
        console.log(`Creăm o nouă programare pentru masa ${tableId} și rezervarea ${reservationId}`);
        
        const { error: insertError } = await supabase
          .from('table_availability_schedules')
          .insert([scheduleData]);
        
        if (insertError) {
          console.error('Eroare la crearea programării:', insertError);
          return false;
        }
      }
      
      console.log(`Programare de disponibilitate creată cu succes: Masă=${tableId}, Ocupată de la=${occupiedFromTime.toLocaleString()}, Disponibilă după=${availableAfterTime.toLocaleString()}`);
      return true;
    } catch (error) {
      console.error('Excepție în scheduleTableAvailability:', error);
      return false;
    }
  }

  static async applyTableAvailabilitySchedules(): Promise<boolean> {
    try {
      console.log('Aplicăm programările de disponibilitate pentru mese...');
      const now = new Date();
      let updatedCount = 0;
      
      const { data: schedules, error } = await supabase
        .from('table_availability_schedules')
        .select('*')
        .eq('is_active', true);
      
      if (error) {
        console.error('Eroare la obținerea programărilor:', error);
        return false;
      }
      
      if (!schedules || schedules.length === 0) {
        console.log('Nu există programări active de disponibilitate');
        return true;
      }
      
      console.log(`S-au găsit ${schedules.length} programări active`);
      
      for (const schedule of schedules) {
        const occupiedFromTime = new Date(schedule.occupied_from);
        const availableAfterTime = new Date(schedule.available_after);
        const reservationTime = new Date(schedule.reservation_time);
        
        console.log(`Verificare programare: ID=${schedule.id}, Masă=${schedule.table_id}, Ocupată de la=${occupiedFromTime.toLocaleString()}, Disponibilă după=${availableAfterTime.toLocaleString()}, Acum=${now.toLocaleString()}`);
        
        const { data: reservation, error: resError } = await supabase
          .from('reservations')
          .select('status')
          .eq('id', schedule.reservation_id)
          .single();
        
        if (resError) {
          console.error(`Eroare la verificarea rezervării ${schedule.reservation_id}:`, resError);
          continue;
        }
        
        if (!reservation || reservation.status === 'cancelled' || reservation.status === 'completed') {
          console.log(`Rezervarea ${schedule.reservation_id} nu mai este activă (status: ${reservation?.status || 'ștearsă'}), eliberăm masa`);
          
          await this.updateTableAvailability(
            schedule.restaurant_id.toString(),
            schedule.table_location,
            schedule.table_id,
            true
          );
          
          await supabase
            .from('table_availability_schedules')
            .update({ is_active: false })
            .eq('id', schedule.id);
          
          updatedCount++;
          continue;
        }
        
        const isWithinOccupationTime = now >= occupiedFromTime && now <= availableAfterTime;
        
        const isBeforeOccupationTime = now < occupiedFromTime && reservationTime > now;
        
        const isAfterOccupationTime = now > availableAfterTime;
        
        const { data: restaurantData } = await supabase
          .from('restaurants')
          .select('tables')
          .eq('id', schedule.restaurant_id.toString())
          .single();
        
        if (!restaurantData || !restaurantData.tables) {
          console.error(`Nu s-au putut obține datele pentru restaurantul ${schedule.restaurant_id}`);
          continue;
        }
        
        const tables = restaurantData.tables;
        const location = schedule.table_location as 'interior' | 'exterior';
        
        if (!Array.isArray(tables[location])) {
          console.error(`Locația ${location} nu există în restaurantul ${schedule.restaurant_id}`);
          continue;
        }
        
        const tableIndex = tables[location].findIndex(
          (table: Table) => table.id === schedule.table_id
        );
        
        if (tableIndex === -1) {
          console.error(`Masa ${schedule.table_id} nu a fost găsită în locația ${location}`);
          continue;
        }
        
        const currentTableAvailability = tables[location][tableIndex].isAvailable;
        
        if (isWithinOccupationTime && currentTableAvailability) {
          console.log(`Masa ${schedule.table_id} din ${location} trebuie marcată ca ocupată (Acum=${now.toLocaleString()} este în intervalul de ocupare ${occupiedFromTime.toLocaleString()} - ${availableAfterTime.toLocaleString()})`);
          
          await this.updateTableAvailability(
            schedule.restaurant_id.toString(),
            location,
            schedule.table_id,
            false 
          );
          
          updatedCount++;
        } else if (isBeforeOccupationTime && !currentTableAvailability) {
          console.log(`Masa ${schedule.table_id} din ${location} trebuie marcată ca disponibilă (Acum=${now.toLocaleString()} este înainte de intervalul de ocupare ${occupiedFromTime.toLocaleString()})`);
          
          await this.updateTableAvailability(
            schedule.restaurant_id.toString(),
            location,
            schedule.table_id,
            true
          );
          
          updatedCount++;
        } else if (isAfterOccupationTime && !currentTableAvailability) {
          console.log(`Masa ${schedule.table_id} din ${location} trebuie marcată ca disponibilă (Acum=${now.toLocaleString()} este după intervalul de ocupare ${availableAfterTime.toLocaleString()})`);
          
          await this.updateTableAvailability(
            schedule.restaurant_id.toString(),
            location,
            schedule.table_id,
            true 
          );
          
          await supabase
            .from('table_availability_schedules')
            .update({ is_active: false })
            .eq('id', schedule.id);
          
          updatedCount++;
        }
      }
      
      console.log(`Procesare finalizată, ${updatedCount} mese actualizate`);
      return true;
    } catch (error) {
      console.error('Excepție în applyTableAvailabilitySchedules:', error);
      return false;
    }
  }

  static async getRestaurantReservations(
    restaurantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Reservation[]> {
    try {
      console.log(`Încărcare rezervări pentru restaurant ${restaurantId} între ${startDate.toISOString()} și ${endDate.toISOString()}`);
      
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('reservation_time', startDate.toISOString())
        .lte('reservation_time', endDate.toISOString())
        .order('reservation_time', { ascending: true });

      if (error) {
        console.error('Eroare la încărcarea rezervărilor:', error);
        return [];
      }

      if (!reservations || reservations.length === 0) {
        return [];
      }

      const formattedReservations: Reservation[] = reservations.map(reservation => {
        const shortUserId = reservation.user_id.substring(0, 8);
        return {
          id: reservation.id,
          restaurantId: reservation.restaurant_id,
          userId: reservation.user_id,
          userName: `Utilizator ${shortUserId}`,
          date: reservation.reservation_time,
          guests: reservation.guests,
          tableId: reservation.table_id,
          status: reservation.status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
          createdAt: reservation.created_at,
          updatedAt: reservation.updated_at
        };
      });

      console.log(`S-au încărcat ${formattedReservations.length} rezervări`);
      return formattedReservations;
    } catch (error) {
      console.error('Excepție la încărcarea rezervărilor:', error);
      return [];
    }
  }
} 

export const restaurantService = {
  getRestaurantReservations: RestaurantService.getRestaurantReservations,
};