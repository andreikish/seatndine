import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { openAuthSessionAsync } from 'expo-web-browser';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

type AuthContextType = {
  session: Session | null;
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUserProfile: (updates: { [key: string]: any }) => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: () => boolean;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

WebBrowser.maybeCompleteAuthSession();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state...');
    
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthProvider: Initial session check:', { session, error });
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          setSession(null);
          setUser(null);
        } else if (session) {
          await SecureStore.setItemAsync('session', JSON.stringify(session));
          setSession(session);
          setUser(session.user);
        } else {
          await SecureStore.deleteItemAsync('session');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('AuthProvider: Error in initialization:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('AuthProvider: Auth state changed:', { event: _event, session });
      
      if (session) {
        try {
          await SecureStore.setItemAsync('session', JSON.stringify(session));
          setSession(session);
          setUser(session.user);
        } catch (error) {
          console.error('AuthProvider: Error saving session:', error);
        }
      } else {
        try {
          await SecureStore.deleteItemAsync('session');
          setSession(null);
          setUser(null);
        } catch (error) {
          console.error('AuthProvider: Error deleting session:', error);
        }
      }
    });

    return () => {
      console.log('AuthProvider: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (session) {
      router.replace('/(tabs)');
    }
  }, [session, isInitialized]);

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    console.log('AuthProvider: Attempting sign in...');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('AuthProvider: Sign in error:', error);
        throw error;
      }

      if (data.session) {
        if (rememberMe) {
          await SecureStore.setItemAsync('session', JSON.stringify(data.session));
        }
        setSession(data.session);
        setUser(data.session.user);
      }
      
      console.log('AuthProvider: Sign in successful');
    } catch (error) {
      console.error('AuthProvider: Sign in exception:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log('AuthProvider: Attempting sign up...');
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        console.error('AuthProvider: Sign up error:', error);
        throw error;
      }
      console.log('AuthProvider: Sign up successful');
    } catch (error) {
      console.error('AuthProvider: Sign up exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('AuthProvider: Attempting sign out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthProvider: Sign out error:', error);
        throw error;
      }
      await SecureStore.deleteItemAsync('session');
      setSession(null);
      setUser(null);
      console.log('AuthProvider: Sign out successful');
    } catch (error) {
      console.error('AuthProvider: Sign out exception:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('AuthProvider: Initiating Google sign in...');
      
      const redirectUrl = makeRedirectUri({
        scheme: 'seatndine',
        path: 'auth/callback',
        preferLocalhost: Platform.OS === 'web'
      });

      console.log('AuthProvider: Redirect URL:', redirectUrl);

      await WebBrowser.maybeCompleteAuthSession();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('AuthProvider: Error initiating Google sign in:', error);
        throw error;
      }

      if (data?.url) {
        try {
          console.log('AuthProvider: Opening auth URL:', data.url);
          
          const result = await openAuthSessionAsync(
            data.url,
            redirectUrl
          );

          console.log('AuthProvider: Auth result:', result);

          if (result.type === 'success' && result.url) {
            console.log('AuthProvider: Auth successful, URL:', result.url);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          console.log('AuthProvider: Checking for session after auth...');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('AuthProvider: Session error after auth:', sessionError);
          }
          
          if (session) {
            console.log('AuthProvider: Session found after auth check:', session);
            await SecureStore.setItemAsync('session', JSON.stringify(session));
            setSession(session);
            setUser(session?.user || null);
            router.replace('/(tabs)');
          } else {
            console.log('AuthProvider: No session found after auth check');
            
            setTimeout(async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                console.log('AuthProvider: Session found on second check:', session);
                await SecureStore.setItemAsync('session', JSON.stringify(session));
                setSession(session);
                setUser(session?.user || null);
                router.replace('/(tabs)');
              } else {
                console.log('AuthProvider: Still no session on second check');
              }
            }, 3000);
          }
        } catch (error) {
          console.error('AuthProvider: Error in auth process:', error);
        }
      }
    } catch (error) {
      console.error('AuthProvider: Error signing in with Google:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: { [key: string]: any }) => {
    try {
      console.log('Updating user profile with:', updates);
      
      if (!user) {
        console.log('Nu se poate actualiza profilul: utilizatorul nu este autentificat');
        return;
      }
      
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...user?.user_metadata,
          ...updates
        }
      });

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }

      if (data.user) {
        console.log('User profile updated successfully:', data.user);
        
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error getting session after profile update:', sessionError);
          }
          
          if (session) {
            await SecureStore.setItemAsync('session', JSON.stringify(session));
            setSession(session);
            setUser(session.user);
          }
        } catch (error) {
          console.error('Error updating session after profile update:', error);
        }
      }
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      console.log('AuthProvider: Refreshing session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('AuthProvider: Error refreshing session:', error);
        throw error;
      }
      
      if (session) {
        console.log('AuthProvider: Session refreshed successfully:', session);
        await SecureStore.setItemAsync('session', JSON.stringify(session));
        setSession(session);
        setUser(session.user);
      } else {
        console.log('AuthProvider: No session found after refresh');
      }
    } catch (error) {
      console.error('AuthProvider: Error refreshing session:', error);
      throw error;
    }
  };

  const isAuthenticated = () => {
    return session !== null;
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Inițiere resetare parolă pentru:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'seatndine://reset-password'
      });
      
      if (error) {
        console.error('Eroare la resetarea parolei:', error);
        throw error;
      }
      
      console.log('Email de resetare trimis cu succes');
    } catch (error) {
      console.error('Eroare în resetPassword:', error);
      throw error;
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updateUserProfile,
    refreshSession,
    isAuthenticated,
    resetPassword
  };

  console.log('AuthProvider: Current auth state:', { 
    session: session ? 'present' : 'null', 
    user: user ? 'present' : 'null', 
    loading
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
export default AuthProvider; 