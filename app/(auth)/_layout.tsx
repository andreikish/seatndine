import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen 
        name="sign-in" 
        options={{ 
          headerShown: false,
          headerTitle: 'Login',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="sign-up" 
        options={{ 
          headerShown: false,
          headerTitle: 'Signup',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ 
          headerShown: false,
          headerTitle: 'Resetare parolă',
          headerBackTitle: 'Back'
        }} 
      />
    </Stack>
  );
} 