import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme, View, ActivityIndicator, Text } from 'react-native';
import { useFonts } from 'expo-font';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { ReservationProvider } from '@/contexts/ReservationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { FeedbackProvider } from '@/contexts/FeedbackContext';
import { RecommendationProvider } from '@/contexts/RecommendationContext';
import { StatisticsProvider } from '@/contexts/StatisticsContext';
import { Slot } from 'expo-router';
import { SearchProvider } from '../contexts/SearchContext';
import { AnimationProvider } from '@/contexts/AnimationContext';

export const unstable_settings = {
  initialRouteName: 'splash',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isSplashReady, setIsSplashReady] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      console.log('Fonts loaded successfully');
      setIsReady(true);
      SplashScreen.hideAsync()
        .then(() => {
          console.log('Native splash screen hidden');
          setIsSplashReady(true);
        })
        .catch(console.error);
    }
  }, [loaded]);

  if (!isReady || !isSplashReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <AnimationProvider>
              <FavoritesProvider>
                <ReservationProvider>
                  <NotificationProvider>
                    <FeedbackProvider>
                      <RecommendationProvider>
                        <StatisticsProvider>
                          <SearchProvider>
                            <View style={{ flex: 1 }}>
                              <Slot />
                              <StatusBar style={colorScheme === 'dark' ? "light" : "dark"} />
                            </View>
                          </SearchProvider>
                        </StatisticsProvider>
                      </RecommendationProvider>
                    </FeedbackProvider>
                  </NotificationProvider>
                </ReservationProvider>
              </FavoritesProvider>
            </AnimationProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </View>
  );
}
