import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { RestaurantService } from '@/services/RestaurantService';
import { supabase } from '@/lib/supabase';

interface TableItem {
  id: string;
  seats: number;
  isAvailable: boolean;
}

interface Tables {
  interior: TableItem[];
  exterior: TableItem[];
}

type TableLocation = 'interior' | 'exterior';

interface TableManagerProps {
  restaurantId: string;
  initialTables: Tables | undefined;
  onTablesUpdated: (tables: Tables) => void;
}

export const TableManager: React.FC<TableManagerProps> = ({
  restaurantId,
  initialTables,
  onTablesUpdated,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  const [tables, setTables] = useState<Tables>({
    interior: initialTables?.interior || [],
    exterior: initialTables?.exterior || []
  });
  
  const [activeTab, setActiveTab] = useState<TableLocation>('interior');
  const [loading, setLoading] = useState(false);
  const [newTableSeats, setNewTableSeats] = useState('');
  
  const handleAddTable = () => {
    if (!newTableSeats || isNaN(Number(newTableSeats)) || Number(newTableSeats) <= 0) {
      Alert.alert('Eroare', 'Vă rugăm să introduceți un număr valid de locuri');
      return;
    }

    const seats = Number(newTableSeats);
    const newTable: TableItem = {
      id: Date.now().toString(),
      seats,
      isAvailable: true,
    };

    const updatedTables = { ...tables };
    
    if (!updatedTables[activeTab]) {
      updatedTables[activeTab] = [];
    }
    
    updatedTables[activeTab] = [...updatedTables[activeTab], newTable];

    setTables(updatedTables);
    onTablesUpdated(updatedTables);
    setNewTableSeats('');
  };

  const handleRemoveTable = (tableId: string) => {
    Alert.alert(
      'Confirmare',
      'Sunteți sigur că doriți să ștergeți această masă?',
      [
        { text: 'Anulare', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: () => {
            const updatedTables = { ...tables };
            
            if (updatedTables[activeTab]) {
              updatedTables[activeTab] = updatedTables[activeTab].filter(
                (table) => table.id !== tableId
              );
              
              setTables(updatedTables);
              onTablesUpdated(updatedTables);
            }
          },
        },
      ]
    );
  };

  const toggleTableAvailability = async (tableId: string) => {
    try {
      setLoading(true);

      if (!tables[activeTab]) {
        setLoading(false);
        return;
      }

      const tableIndex = tables[activeTab].findIndex((table) => table.id === tableId);
      if (tableIndex === -1) {
        setLoading(false);
        return;
      }

      const currentTable = tables[activeTab][tableIndex];
      const newAvailability = !currentTable.isAvailable;

      if (newAvailability === true) {
        const { data: activeReservations, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('table_id', tableId)
          .eq('table_location', activeTab)
          .in('status', ['confirmed', 'pending'])
          .order('reservation_time', { ascending: false });
        
        if (reservationsError) {
          console.error('Eroare la verificarea rezervărilor active:', reservationsError);
          Alert.alert('Eroare', 'Nu s-a putut verifica dacă există rezervări active pentru această masă');
          setLoading(false);
          return;
        }
        
        if (activeReservations && activeReservations.length > 0) {
          console.log(`S-a găsit o rezervare activă pentru masa ${tableId} din ${activeTab}. Marcăm rezervarea ca finalizată.`);
          
          const reservationToComplete = activeReservations[0];
          
          const { error: updateError } = await supabase
            .from('reservations')
            .update({ status: 'completed' })
            .eq('id', reservationToComplete.id);
          
          if (updateError) {
            console.error('Eroare la marcarea rezervării ca finalizată:', updateError);
            Alert.alert('Eroare', 'Nu s-a putut marca rezervarea ca finalizată, dar vom încerca să eliberăm masa.');
          } else {
            console.log(`Rezervarea ${reservationToComplete.id} a fost marcată ca finalizată cu succes.`);
            
            const { error: scheduleError } = await supabase
              .from('table_availability_schedules')
              .update({ is_active: false })
              .eq('reservation_id', reservationToComplete.id);
            
            if (scheduleError) {
              console.error('Eroare la dezactivarea programării de disponibilitate:', scheduleError);
            }
          }
        }
      }

      const updatedTables = { ...tables };
      updatedTables[activeTab][tableIndex] = {
        ...currentTable,
        isAvailable: newAvailability,
      };

      setTables(updatedTables);
      onTablesUpdated(updatedTables);

      await RestaurantService.updateTableAvailability(
        restaurantId,
        activeTab,
        tableId,
        newAvailability
      );
    } catch (error) {
      console.error('Eroare la actualizarea disponibilității mesei:', error);
      Alert.alert('Eroare', 'Nu s-a putut actualiza disponibilitatea mesei');
    } finally {
      setLoading(false);
    }
  };

  const renderTables = () => {
    const currentTables = tables[activeTab] || [];

    if (currentTables.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            Nu există mese {activeTab === 'interior' ? 'în interior' : 'în exterior'}.
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.text }]}>
            Adăugați mese folosind formularul de mai jos.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tableListContainer}>
        <ScrollView 
          style={styles.tableList}
          contentContainerStyle={styles.tableListContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {currentTables.map((table) => (
            <View
              key={table.id}
              style={[
                styles.tableItem,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: table.isAvailable
                    ? theme.colors.success
                    : theme.colors.notification,
                },
              ]}
            >
              <View style={styles.tableInfo}>
                <Text style={[styles.tableId, { color: theme.colors.text }]}>
                  Masa #{table.id}
                </Text>
                <Text style={[styles.tableSeats, { color: theme.colors.text }]}>
                  {table.seats} {table.seats === 1 ? 'loc' : 'locuri'}
                </Text>
                <Text
                  style={[
                    styles.tableStatus,
                    {
                      color: table.isAvailable
                        ? theme.colors.success
                        : theme.colors.notification,
                    },
                  ]}
                >
                  {table.isAvailable ? 'Disponibilă' : 'Ocupată'}
                </Text>
              </View>
              
              <View style={styles.tableActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: table.isAvailable
                        ? theme.colors.notification
                        : theme.colors.success,
                    },
                  ]}
                  onPress={() => toggleTableAvailability(table.id)}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>
                    {table.isAvailable ? 'Ocupă' : 'Eliberează'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                  onPress={() => handleRemoveTable(table.id)}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>Șterge</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Gestiune Mese
      </Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'interior' && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setActiveTab('interior')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'interior'
                    ? '#FFFFFF'
                    : theme.colors.text,
              },
            ]}
          >
            Interior
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'exterior' && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setActiveTab('exterior')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'exterior'
                    ? '#FFFFFF'
                    : theme.colors.text,
              },
            ]}
          >
            Exterior
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={styles.loader}
        />
      )}

      {renderTables()}

      <View style={styles.addTableContainer}>
        <Text style={[styles.addTableTitle, { color: theme.colors.text }]}>
          Adaugă masă nouă - {activeTab === 'interior' ? 'Interior' : 'Exterior'}
        </Text>
        
        <View style={styles.addTableForm}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.colors.card, color: theme.colors.text },
            ]}
            value={newTableSeats}
            onChangeText={setNewTableSeats}
            placeholder="Număr de locuri"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
          
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddTable}
          >
            <Text style={styles.addButtonText}>Adaugă</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 16,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabText: {
    fontWeight: '500',
  },
  tableListContainer: {
    height: 300,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#33333333',
    borderRadius: 8,
  },
  tableList: {
    flex: 1,
  },
  tableListContent: {
    paddingRight: 2,
    paddingLeft: 2,
    paddingVertical: 4,
  },
  tableItem: {
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 4,
  },
  tableInfo: {
    marginBottom: 8,
  },
  tableId: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  tableSeats: {
    fontSize: 14,
    marginBottom: 4,
  },
  tableStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  tableActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  addTableContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  addTableTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  addTableForm: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  loader: {
    marginVertical: 8,
  },
}); 