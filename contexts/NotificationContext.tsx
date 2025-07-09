import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useReservations } from './ReservationContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { reservations } = useReservations();

  useEffect(() => {
    const checkReservations = () => {
      const now = new Date();
      
      reservations.forEach(reservation => {
        const reservationDate = new Date(reservation.date);
        const timeDiff = reservationDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff > 23 && hoursDiff < 25) {
          addNotification({
            title: 'Rezervare în curând',
            message: `Ai o rezervare la ${reservation.restaurantName} în 24 de ore.`,
            type: 'info'
          });
        }
        
        if (hoursDiff > 0 && hoursDiff < 1) {
          addNotification({
            title: 'Rezervare în curând',
            message: `Ai o rezervare la ${reservation.restaurantName} în 1 oră.`,
            type: 'info'
          });
        }
      });
    };
    
    const interval = setInterval(checkReservations, 30 * 60 * 1000);
    checkReservations();
    
    return () => clearInterval(interval);
  }, [reservations]);

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    if (notification.type === 'error' || notification.type === 'warning') {
      Alert.alert(notification.title, notification.message);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      clearAll,
      unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export { NotificationContext };
export default NotificationProvider; 