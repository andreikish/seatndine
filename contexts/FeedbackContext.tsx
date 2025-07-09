import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useReservations } from './ReservationContext';
import { useNotifications } from './NotificationContext';

export interface Feedback {
  id: string;
  userId: string;
  restaurantId: string;
  rating: number;
  comment: string;
  createdAt: string;
  photos?: string[];
}

interface FeedbackContextType {
  feedbacks: Feedback[];
  addFeedback: (feedback: Omit<Feedback, 'id' | 'userId' | 'createdAt'>) => void;
  getFeedbackForRestaurant: (restaurantId: string) => Feedback[];
  getFeedbackForUser: (userId: string) => Feedback[];
  deleteFeedback: (id: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const { user } = useAuth();
  const { reservations } = useReservations();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!user) return;

    const completedReservations = reservations.filter(
      r => r.status === 'completed' && !feedbacks.some(f => f.restaurantId === r.restaurantId)
    );

    completedReservations.forEach(reservation => {
      addNotification({
        title: 'Oferă feedback',
        message: `Cum a fost experiența ta la ${reservation.restaurantName}?`,
        type: 'info'
      });
    });
  }, [reservations, user, feedbacks]);

  const addFeedback = (feedback: Omit<Feedback, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;

    const newFeedback: Feedback = {
      ...feedback,
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      createdAt: new Date().toISOString()
    };

    setFeedbacks(prev => [...prev, newFeedback]);

    addNotification({
      title: 'Feedback salvat',
      message: 'Mulțumim pentru feedback!',
      type: 'success'
    });
  };

  const getFeedbackForRestaurant = (restaurantId: string) => {
    return feedbacks.filter(f => f.restaurantId === restaurantId);
  };

  const getFeedbackForUser = (userId: string) => {
    return feedbacks.filter(f => f.userId === userId);
  };

  const deleteFeedback = (id: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id));
  };

  return (
    <FeedbackContext.Provider value={{
      feedbacks,
      addFeedback,
      getFeedbackForRestaurant,
      getFeedbackForUser,
      deleteFeedback
    }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
} 