import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { code, type, token } = params;

  useEffect(() => {
    console.log('[AuthCallback] Parametri primiți:', { code, type, token });
    console.log('[AuthCallback] Toți parametrii:', params);
    
    const handleCallback = async () => {
      try {
        if (type === 'recovery' && token) {
          console.log('[AuthCallback] Procesăm resetarea parolei...');
          router.replace('/(auth)/reset-password');
          return;
        }

        if (code) {
          console.log('[AuthCallback] Am primit code:', code);
          
          if (type === 'email_change') {
            console.log('[AuthCallback] Procesăm schimbarea emailului...');
            
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log('[AuthCallback] Sesiune curentă:', session);
            
            if (sessionError) {
              console.error('[AuthCallback] Error getting session:', sessionError);
              router.replace('/(auth)/sign-in');
              return;
            }

            if (session) {
              const email = params.email
              console.log('[AuthCallback] Încercăm să actualizăm emailul la:', email);
              
              const { data: updateData, error: updateError } = await supabase.auth.updateUser({
                email: email as string
              });

              if (updateError) {
                console.error('[AuthCallback] Error updating email:', updateError);
                router.replace('/(auth)/sign-in');
                return;
              }

              console.log('[AuthCallback] Rezultat actualizare:', updateData);
              console.log('[AuthCallback] Email schimbat cu succes!');
              
              const { data: { session: newSession } } = await supabase.auth.getSession();
              console.log('[AuthCallback] Sesiune după actualizare:', newSession);
              
              router.replace('/(tabs)');
            } else {
              console.error('[AuthCallback] Nu am găsit sesiune activă!');
              router.replace('/(auth)/sign-in');
            }
          } else {
            const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code as string);
            
            if (error) {
              console.error('[AuthCallback] Error exchanging code for session:', error);
              router.replace('/(auth)/sign-in');
              return;
            }

            if (session) {
              console.log('[AuthCallback] Sesiune obținută cu succes:', session);
              router.replace('/(tabs)');
            } else {
              console.warn('[AuthCallback] Nu am primit sesiune după exchange!');
            }
          }
        } else {
          console.warn('[AuthCallback] Nu am primit niciun cod în parametri!');
        }
      } catch (error) {
        console.error('[AuthCallback] Error in auth callback:', error);
        router.replace('/(auth)/sign-in');
      }
    };

    handleCallback();
  }, [code, type, token]);

  return null;
} 