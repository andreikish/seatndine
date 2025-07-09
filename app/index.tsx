import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, ActivityIndicator, ImageBackground } from 'react-native';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '@/app/config/theme';
import { router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/AuthContext';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { session, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<Video>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (!loading) {
      setIsReady(true);
    }
  }, [loading]);

  useEffect(() => {
    setRetryCount(0);
  }, []);

  const handleGetStarted = () => {
    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/sign-in');
    }
  };

  const onVideoError = (error: string) => {
    console.log('Eroare la încărcarea video:', error);
    
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.loadAsync(
            require('@/assets/videos/background.mp4'),
            {
              shouldPlay: true,
              isLooping: true,
              isMuted: true,
              progressUpdateIntervalMillis: 1000,
              positionMillis: 0,
            },
            false
          );
        }
      }, 1000 * (retryCount + 1));
    } else {
      setVideoError(true);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (!isVideoReady) {
        setIsVideoReady(true);
        setRetryCount(0); 
      }
      
      if (status.positionMillis > 0 && 
          status.durationMillis && 
          status.durationMillis - status.positionMillis < 1000) {
        videoRef.current?.setPositionAsync(0);
      }
    }
  };

  const onLoadStart = () => {
    setIsVideoReady(false);
  };

  const onLoad = () => {
    setIsVideoReady(true);
    setRetryCount(0);
  };

  if (!isReady) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: '#FFFFFF' }}>Se încarcă...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {videoError ? (
        <ImageBackground 
          source={require('@/assets/images/placeholder.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      ) : (
        <Video 
          ref={videoRef}
          source={require('@/assets/videos/background.mp4')}
          style={styles.backgroundVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay={true}
          isLooping={true}
          isMuted={true}
          rate={1.0}
          onError={onVideoError}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onLoadStart={onLoadStart}
          onLoad={onLoad}
          useNativeControls={false}
          progressUpdateIntervalMillis={1000}
          posterSource={require('@/assets/images/placeholder.png')}
          posterStyle={styles.backgroundVideo}
          volume={1.0}
          shouldCorrectPitch={true}
        />
      )}
      
      <View style={styles.overlay} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Seat'nDine</Text>
          <Text style={styles.subtitle}>Rezervă la restaurantele tale preferate</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Să începem</Text>
          <AntDesign name="arrowright" size={20} color="#FFFFFF" style={styles.buttonIcon} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    zIndex: 1,
    marginTop: height * 0.15,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 50,
    width: width * 0.8,
    maxWidth: 400,
    alignSelf: 'center',
    zIndex: 1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 5,
  },
}); 