import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async registerForPushNotifications() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Nu am primit permisiunea pentru notificări!');
      }
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || undefined,
      });
      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('reservations', {
          name: 'Rezervări',
          description: 'Notificări legate de rezervările la restaurante',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF9500',
        });
      }
      
      return token;
    } catch (error) {
      console.error('Eroare la înregistrarea pentru notificări:', error);
      return null;
    }
  }
  
  static async scheduleReservationReminder(reservationId: string, restaurantName: string, date: Date) {
    try {
      console.log(`[DEBUG] Verificare parametru date în scheduleReservationReminder:`, {
        date,
        isDate: date instanceof Date,
        asString: date.toString(),
        asLocaleString: date.toLocaleString(),
        asISO: date.toISOString(),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        timestamp: date.getTime()
      });

      await NotificationService.cancelReservationReminders(reservationId);

      const now = new Date();
      const timeUntilReservation = date.getTime() - now.getTime();
      const minutesUntilReservation = Math.round(timeUntilReservation / (60 * 1000));
      
      console.log(`[DEBUG] Analiză timp până la rezervare: 
        - Data rezervării: ${date.toLocaleString()} (${date.getTime()})
        - Data curentă: ${now.toLocaleString()} (${now.getTime()})
        - Diferența în minute: ${minutesUntilReservation}
        - Diferența în ore: ${Math.round(minutesUntilReservation / 60)}
      `);
      
      if (date <= now) {
        console.log('Data rezervării este în trecut, nu se programează notificări');
        return;
      }

      console.log(`Programare notificări pentru rezervarea la ${restaurantName} la data ${date.toLocaleString()}`);
      
      let createSuccessCount = 0;
      
      const showEstimatedTime = (notificationDate: Date) => {
        return notificationDate.toLocaleString();
      };

      if (minutesUntilReservation > 1440) {
        const dayBefore = new Date(date.getTime() - (24 * 60 * 60 * 1000));
        console.log(`Programez notificare pentru 24 ore înainte pentru: ${showEstimatedTime(dayBefore)}`);
        try {
          const identifier = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Rezervare în curând',
              body: `Ai o rezervare la ${restaurantName} mâine!`,
              data: { reservationId, type: 'reservation_reminder_24h' },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.DEFAULT,
            },
            trigger: {
              date: dayBefore,
              channelId: 'reservations',
              type: Notifications.SchedulableTriggerInputTypes.DATE,
            },
          });
          console.log(`Programat cu succes notificare (ID: ${identifier}) pentru 24h înainte la: ${showEstimatedTime(dayBefore)}`);
          createSuccessCount++;
        } catch (notificationError) {
          console.error('Eroare la programarea notificării de 24 ore:', notificationError);
        }
      } else {
        console.log(`Rezervarea este în mai puțin de 24 ore (${minutesUntilReservation} minute), nu se programează notificarea de 24h`);
      }
      
      if (minutesUntilReservation > 60) {
        const hourBefore = new Date(date.getTime() - (60 * 60 * 1000));
        console.log(`Programez notificare pentru 1 oră înainte pentru: ${showEstimatedTime(hourBefore)}`);
        try {
          const identifier = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Rezervare în curând',
              body: `Ai o rezervare la ${restaurantName} în 1 oră!`,
              data: { reservationId, type: 'reservation_reminder_1h' },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.DEFAULT,
            },
            trigger: {
              date: hourBefore,
              channelId: 'reservations',
              type: Notifications.SchedulableTriggerInputTypes.DATE,
            },
          });
          console.log(`Programat cu succes notificare (ID: ${identifier}) pentru 1h înainte la: ${showEstimatedTime(hourBefore)}`);
          createSuccessCount++;
        } catch (notificationError) {
          console.error('Eroare la programarea notificării de 1 oră:', notificationError);
        }
      } else {
        console.log(`Rezervarea este în mai puțin de 1 oră (${minutesUntilReservation} minute), nu se programează notificarea de 1h`);
      }

      if (minutesUntilReservation > 15) {
        const minutesBefore = new Date(date.getTime() - (15 * 60 * 1000));
        console.log(`Programez notificare pentru 15 minute înainte pentru: ${showEstimatedTime(minutesBefore)}`);
        try {
          const identifier = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Este timpul să pleci',
              body: `Rezervarea ta la ${restaurantName} este în 15 minute!`,
              data: { reservationId, type: 'reservation_reminder_15min' },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              date: minutesBefore,
              channelId: 'reservations',
              type: Notifications.SchedulableTriggerInputTypes.DATE,
            },
          });
          console.log(`Programat cu succes notificare (ID: ${identifier}) pentru 15min înainte la: ${showEstimatedTime(minutesBefore)}`);
          createSuccessCount++;
        } catch (notificationError) {
          console.error('Eroare la programarea notificării de 15 minute:', notificationError);
        }
      } else {
        console.log(`Rezervarea este în mai puțin de 15 minute (${minutesUntilReservation} minute), nu se trimite nicio notificare`);
      }
      
      console.log(`Toate notificările programate pentru rezervarea la ${restaurantName}. Succese: ${createSuccessCount}/3`);
      
      const scheduledNotifs = await Notifications.getAllScheduledNotificationsAsync();
      const reservationNotifs = scheduledNotifs.filter(n => 
        n.content.data?.reservationId === reservationId
      );
      
      console.log(`Verificare: ${reservationNotifs.length} notificări programate pentru rezervarea ${reservationId}`);
      
      reservationNotifs.forEach((notif, index) => {
        console.log(`Notificare ${index + 1}:`);
        console.log(`  Titlu: ${notif.content.title}`);
        console.log(`  Mesaj: ${notif.content.body}`);
        console.log(`  Tip: ${notif.content.data?.type}`);
        if (notif.trigger && 'date' in notif.trigger) {
          const triggerDate = new Date(notif.trigger.date);
          const timeUntilTrigger = Math.round((triggerDate.getTime() - now.getTime()) / (60 * 1000));
          console.log(`  Programată pentru: ${triggerDate.toLocaleString()}`);
          console.log(`  Timp până la notificare: ${timeUntilTrigger} minute`);
        }
      });
      
    } catch (error) {
      console.error('Eroare la programarea notificărilor:', error);
    }
  }
  
  static async cancelReservationReminders(reservationId: string) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const reservationNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.reservationId === reservationId
      );
      
      for (const notification of reservationNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
      
      console.log(`Anulate ${reservationNotifications.length} notificări pentru rezervarea ${reservationId}`);
    } catch (error) {
      console.error('Eroare la anularea notificărilor:', error);
    }
  }
  
  static async sendReservationConfirmation(restaurantName: string, date: Date) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rezervare confirmată',
          body: `Rezervarea ta la ${restaurantName} a fost confirmată pentru ${date.toLocaleDateString()}.`,
          data: { 
            type: 'reservation_confirmation',
            restaurantName,
            date: date.toISOString()
          },
        },
        trigger: null,
      });
      console.log(`Notificare de confirmare trimisă pentru ${restaurantName}`);
    } catch (error) {
      console.error('Eroare la trimiterea confirmării:', error);
    }
  }
  
  static async sendReservationCancellation(restaurantName: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rezervare anulată',
          body: `Rezervarea ta la ${restaurantName} a fost anulată.`,
          data: { 
            type: 'reservation_cancellation',
            restaurantName
          },
        },
        trigger: null,
      });
      console.log(`Notificare de anulare trimisă pentru ${restaurantName}`);
    } catch (error) {
      console.error('Eroare la trimiterea notificării de anulare:', error);
    }
  }
  
  static async sendReservationModification(restaurantName: string, newDate: Date) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rezervare modificată',
          body: `Rezervarea ta la ${restaurantName} a fost modificată pentru ${newDate.toLocaleDateString()}.`,
          data: { 
            type: 'reservation_modification',
            restaurantName,
            newDate: newDate.toISOString()
          },
        },
        trigger: null,
      });
      console.log(`Notificare de modificare trimisă pentru ${restaurantName}`);
    } catch (error) {
      console.error('Eroare la trimiterea notificării de modificare:', error);
    }
  }

  static async sendSpecialOffer(restaurantName: string, offerText: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ofertă specială!',
          body: `${restaurantName}: ${offerText}`,
          data: { 
            type: 'special_offer',
            restaurantName,
            offerText
          },
        },
        trigger: null,
      });
      console.log(`Notificare de ofertă trimisă pentru ${restaurantName}`);
    } catch (error) {
      console.error('Eroare la trimiterea notificării de ofertă:', error);
    }
  }

  static async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`Notificări programate: ${notifications.length}`);
      notifications.forEach((notification, index) => {
        console.log(`Notificare ${index + 1}:`);
        console.log(`- Titlu: ${notification.content.title}`);
        console.log(`- Corp: ${notification.content.body}`);
        console.log(`- Trigger: ${JSON.stringify(notification.trigger)}`);
        console.log(`- ID: ${notification.identifier}`);
      });
      return notifications;
    } catch (error) {
      console.error('Eroare la obținerea notificărilor programate:', error);
      return [];
    }
  }

  static async dismissAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  static async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  }

  static async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  static async cancelAllNotifications() {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
      
      await Notifications.dismissAllNotificationsAsync();
      
      await Notifications.setBadgeCountAsync(0);
      
      console.log(`Au fost anulate ${scheduledNotifications.length} notificări programate`);
      return scheduledNotifications.length;
    } catch (error) {
      console.error('Eroare la anularea tuturor notificărilor:', error);
      throw error;
    }
  }

  static async notifyRestaurant(restaurantId: string | number, title: string, body: string) {
    console.log(`[DEBUG] Notificare restaurant ${restaurantId}: ${title} - ${body}`);
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            type: 'restaurant_update',
            restaurantId: restaurantId.toString()
          },
        },
        trigger: null,
      });
      console.log(`Notificare restaurant trimisă pentru ${restaurantId}`);
    } catch (error) {
      console.error('Eroare la trimiterea notificării restaurant:', error);
    }
  }
}