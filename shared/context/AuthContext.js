import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStoredSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        SecureStore.setItemAsync('session', JSON.stringify(session));
      } else {
        SecureStore.deleteItemAsync('session');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  async function checkStoredSession() {
    try {
      const storedSession = await SecureStore.getItemAsync('session');
      if (storedSession) {
        setSession(JSON.parse(storedSession));
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async function refreshSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(session);
      if (session) {
        await SecureStore.setItemAsync('session', JSON.stringify(session));
      }
    } catch (error) {
      console.error('Eroare la reîmprospătarea sesiunii:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ session, loading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 