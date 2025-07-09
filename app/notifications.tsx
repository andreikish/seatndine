import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from './config/theme';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationService } from '@/services/NotificationService';

export default function NotificationsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [promotionsEnabled, setPromotionsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { notifications, markAsRead, clearAll } = useNotifications();

  useEffect(() => {
    const checkNotificationPermissions = async () => {
      try {
        setLoading(true);
        const token = await NotificationService.registerForPushNotifications();
        if (!token) {
          setPushEnabled(false);
        }
      } catch (error) {
        console.error("Eroare la verificarea permisiunilor:", error);
        setPushEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkNotificationPermissions();
  }, []);

  const handleTogglePushNotifications = async (value: boolean) => {
    setPushEnabled(value);
    if (value) {
      try {
        setLoading(true);
        await NotificationService.registerForPushNotifications();
      } catch (error) {
        console.error("Eroare la activarea notificărilor:", error);
        setPushEnabled(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const renderTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'zi' : 'zile'} în urmă`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'oră' : 'ore'} în urmă`;
    } else {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minut' : 'minute'} în urmă`;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Notificări</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Setări Notificări</Text>
          
          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingLeft}>
              <IconSymbol name="bell.fill" size={24} color={theme.colors.primary} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Notificări Push</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePushNotifications}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.card}
              />
            )}
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingLeft}>
              <IconSymbol name="message.fill" size={24} color={theme.colors.primary} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Notificări Email</Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingLeft}>
              <IconSymbol name="star.fill" size={24} color={theme.colors.primary} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Promoții & Oferte</Text>
            </View>
            <Switch
              value={promotionsEnabled}
              onValueChange={setPromotionsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notificări Recente</Text>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={clearAll}>
                <Text style={[styles.clearButton, { color: theme.colors.primary }]}>Șterge tot</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {notifications.length === 0 ? (
            <View style={styles.emptyNotifications}>
              <IconSymbol name="bell.slash.fill" size={48} color={theme.colors.placeholder} />
              <Text style={[styles.emptyText, { color: theme.colors.placeholder }]}>
                Nu aveți notificări
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  { borderBottomColor: theme.colors.border },
                  !notification.read && [styles.unreadNotification, { backgroundColor: theme.colors.highlight }],
                ]}
                onPress={() => handleMarkAsRead(notification.id)}
              >
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                    {notification.title}
                  </Text>
                  <Text style={[styles.notificationMessage, { color: theme.colors.secondaryText }]}>
                    {notification.message}
                  </Text>
                  <Text style={[styles.notificationTime, { color: theme.colors.placeholder }]}>
                    {renderTimeAgo(notification.createdAt)}
                  </Text>
                </View>
                {!notification.read && (
                  <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
                )}
              </TouchableOpacity>
            ))
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  unreadNotification: {
    opacity: 0.9,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    alignSelf: 'center',
  },
}); 