import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://kywckicgqzdqadkhmtpz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5d2NraWNncXpkcWFka2htdHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyNjgzMjUsImV4cCI6MjA1OTg0NDMyNX0.KSpMkOM161oiH0tUJmi-vDoLLtMmXZVtPdvMMKbBKzA';

console.log('Supabase Configuration:', {
  url: SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY,
  config: Constants.expoConfig?.extra
});

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
}); 