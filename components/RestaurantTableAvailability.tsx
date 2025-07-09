import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface TableSummary {
  seats: number;
  count: number;
  available: number;
}

interface TableAvailabilityProps {
  tables: {
    interior: {
      id: string;
      seats: number;
      isAvailable: boolean;
    }[];
    exterior: {
      id: string;
      seats: number;
      isAvailable: boolean;
    }[];
  };
  restaurantId?: string;
  isAdmin?: boolean;
  onRefresh?: () => void;
  onClose?: () => void;
}

export const RestaurantTableAvailability: React.FC<TableAvailabilityProps> = ({ tables, restaurantId, isAdmin, onRefresh, onClose }) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [activeTab, setActiveTab] = useState<'interior' | 'exterior'>('interior');
  const [tableSummary, setTableSummary] = useState<{
    interior: TableSummary[];
    exterior: TableSummary[];
  }>({
    interior: [],
    exterior: []
  });

  useEffect(() => {
    const processTableData = () => {
      if (!tables || typeof tables !== 'object') {
        console.log('Structura meselor lipsește sau este incorectă:', tables);
        setTableSummary({
          interior: [],
          exterior: []
        });
        return;
      }
      
      const interior = Array.isArray(tables.interior) ? tables.interior : [];
      const exterior = Array.isArray(tables.exterior) ? tables.exterior : [];
      
      const summaryData = {
        interior: summarizeTables(interior),
        exterior: summarizeTables(exterior)
      };
      
      setTableSummary(summaryData);
    };
    
    processTableData();
  }, [tables]);

  const summarizeTables = (tableData: { id: string; seats: number; isAvailable: boolean }[]): TableSummary[] => {
    const seatsSummary: Record<number, { count: number; available: number }> = {};
    
    tableData.forEach(table => {
      if (!seatsSummary[table.seats]) {
        seatsSummary[table.seats] = { count: 0, available: 0 };
      }
      
      seatsSummary[table.seats].count += 1;
      if (table.isAvailable) {
        seatsSummary[table.seats].available += 1;
      }
    });
    
    return Object.entries(seatsSummary)
      .map(([seats, summary]) => ({
        seats: parseInt(seats),
        count: summary.count,
        available: summary.available
      }))
      .sort((a, b) => a.seats - b.seats);
  };

  const getTotalAvailability = (location: 'interior' | 'exterior') => {
    const totalTables = tableSummary[location].reduce((sum, item) => sum + item.count, 0);
    const availableTables = tableSummary[location].reduce((sum, item) => sum + item.available, 0);
    
    return {
      total: totalTables,
      available: availableTables,
      percentage: totalTables > 0 ? Math.round((availableTables / totalTables) * 100) : 0
    };
  };

  const interiorAvailability = getTotalAvailability('interior');
  const exteriorAvailability = getTotalAvailability('exterior');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'interior' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('interior')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'interior' ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            Interior ({interiorAvailability.available}/{interiorAvailability.total})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'exterior' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('exterior')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'exterior' ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            Exterior ({exteriorAvailability.available}/{exteriorAvailability.total})
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.summaryContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.availabilityMeter}>
          <View 
            style={[
              styles.availabilityFill, 
              { 
                width: `${activeTab === 'interior' ? interiorAvailability.percentage : exteriorAvailability.percentage}%`,
                backgroundColor: theme.colors.primary
              }
            ]} 
          />
        </View>
        <Text style={[styles.summaryText, { color: theme.colors.text }]}>
          {activeTab === 'interior' ? interiorAvailability.percentage : exteriorAvailability.percentage}% disponibil
        </Text>
      </View>
      
      <ScrollView style={styles.tableList}>
        {tableSummary[activeTab].length > 0 ? (
          tableSummary[activeTab].map((item, index) => (
            <View key={index} style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.tableInfo}>
                <Text style={[styles.tableSeats, { color: theme.colors.text }]}>
                  Mese cu {item.seats} {item.seats === 1 ? 'loc' : 'locuri'}
                </Text>
                <Text style={[styles.tableCount, { color: theme.colors.text }]}>
                  {item.count} {item.count === 1 ? 'masă' : 'mese'} total
                </Text>
              </View>
              <View style={styles.availabilityBadge}>
                <Text style={[
                  styles.availabilityText, 
                  { 
                    color: item.available > 0 ? '#4CAF50' : '#F44336',
                    fontWeight: 'bold'
                  }
                ]}>
                  {item.available} disponibile
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              Nu există mese configurate pentru {activeTab === 'interior' ? 'interior' : 'exterior'}.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDDDDD',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabText: {
    fontWeight: '500',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  availabilityMeter: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  availabilityFill: {
    height: '100%',
    borderRadius: 6,
  },
  summaryText: {
    fontSize: 14,
    textAlign: 'right',
  },
  tableList: {
    maxHeight: 300,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableInfo: {
    flex: 1,
  },
  tableSeats: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  tableCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  availabilityText: {
    fontSize: 14,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 