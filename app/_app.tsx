import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ReservationProvider } from '@/contexts/ReservationContext';
import { Platform } from 'react-native';

export default function App() {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <ReservationProvider>
          <NotificationProvider>
            <Stack 
              screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_right',
                presentation: 'card',
                animationDuration: 300,
                contentStyle: { backgroundColor: 'transparent' },
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                ...Platform.select({
                  ios: {
                    fullScreenGestureEnabled: true,
                  },
                  android: {
                    animation: 'fade_from_bottom',
                  },
                }),
              }} 
            />
          </NotificationProvider>
        </ReservationProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
} 