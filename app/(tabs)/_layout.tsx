import { Tabs } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const { isDarkMode, colors } = useTheme();
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          elevation: 8,
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: -2 },
          ...Platform.select({
            ios: {
              height: 90,
              paddingBottom: 30,
            },
          }),
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontWeight: '500',
          fontSize: 11,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Acasă',
          tabBarIcon: ({ color }) => <IconSymbol name="house.fill" color={color} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorite',
          tabBarIcon: ({ color }) => <IconSymbol name="heart.fill" color={color} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Hartă',
          tabBarIcon: ({ color }) => <IconSymbol name="map.fill" color={color} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Rezervări',
          tabBarIcon: ({ color }) => <IconSymbol name="calendar" color={color} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistici',
          tabBarIcon: ({ color }) => <IconSymbol name="star.fill" color={color} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          title: 'Recomandări',
          tabBarIcon: ({ color }) => <IconSymbol name="lightbulb.fill" color={color} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Setări',
          tabBarIcon: ({ color }) => <IconSymbol name="gearshape.fill" color={color} />,
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />
    </Tabs>
  );
}
