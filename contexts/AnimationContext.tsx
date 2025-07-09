import React, { createContext, useContext, ReactNode } from 'react';
import { 
  SharedValue, 
  useSharedValue, 
  withTiming, 
  withSpring, 
  withDelay,
  Easing
} from 'react-native-reanimated';

type AnimationConfig = {
  duration?: number;
  delay?: number;
  easing?: any;
  useSpring?: boolean;
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
    overshootClamping?: boolean;
    restDisplacementThreshold?: number;
    restSpeedThreshold?: number;
  };
};

interface AnimationContextType {
  fadeIn: (value: SharedValue<number>, config?: AnimationConfig) => void;
  fadeOut: (value: SharedValue<number>, config?: AnimationConfig) => void;
  slideIn: (value: SharedValue<number>, from: number, to: number, config?: AnimationConfig) => void;
  slideOut: (value: SharedValue<number>, from: number, to: number, config?: AnimationConfig) => void;
  scale: (value: SharedValue<number>, from: number, to: number, config?: AnimationConfig) => void;
  createOpacity: () => SharedValue<number>;
  createTranslation: () => SharedValue<number>;
  createScale: () => SharedValue<number>;
}

const AnimationContext = createContext<AnimationContextType | null>(null);

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

export const AnimationProvider = ({ children }: { children: ReactNode }) => {
  const createOpacity = () => useSharedValue(0);
  const createTranslation = () => useSharedValue(0);
  const createScale = () => useSharedValue(1);

  const fadeIn = (
    value: SharedValue<number>, 
    config: AnimationConfig = {}
  ) => {
    const { 
      duration = 300, 
      delay = 0, 
      easing = Easing.bezier(0.25, 0.1, 0.25, 1),
      useSpring = false,
      springConfig
    } = config;

    if (useSpring) {
      value.value = withDelay(
        delay, 
        withSpring(1, springConfig)
      );
    } else {
      value.value = withDelay(
        delay,
        withTiming(1, {
          duration,
          easing,
        })
      );
    }
  };

  const fadeOut = (
    value: SharedValue<number>, 
    config: AnimationConfig = {}
  ) => {
    const { 
      duration = 300, 
      delay = 0, 
      easing = Easing.bezier(0.25, 0.1, 0.25, 1),
      useSpring = false,
      springConfig
    } = config;

    if (useSpring) {
      value.value = withDelay(
        delay, 
        withSpring(0, springConfig)
      );
    } else {
      value.value = withDelay(
        delay,
        withTiming(0, {
          duration,
          easing,
        })
      );
    }
  };

  const slideIn = (
    value: SharedValue<number>,
    from: number,
    to: number,
    config: AnimationConfig = {}
  ) => {
    const { 
      duration = 400, 
      delay = 0, 
      easing = Easing.bezier(0.25, 0.1, 0.25, 1),
      useSpring = false,
      springConfig
    } = config;

    value.value = from;
    
    if (useSpring) {
      value.value = withDelay(
        delay, 
        withSpring(to, springConfig)
      );
    } else {
      value.value = withDelay(
        delay,
        withTiming(to, {
          duration,
          easing,
        })
      );
    }
  };

  const slideOut = (
    value: SharedValue<number>,
    from: number,
    to: number,
    config: AnimationConfig = {}
  ) => {
    const { 
      duration = 300, 
      delay = 0, 
      easing = Easing.bezier(0.25, 0.1, 0.25, 1),
      useSpring = false,
      springConfig
    } = config;

    value.value = from;
    
    if (useSpring) {
      value.value = withDelay(
        delay, 
        withSpring(to, springConfig)
      );
    } else {
      value.value = withDelay(
        delay,
        withTiming(to, {
          duration,
          easing,
        })
      );
    }
  };

  const scale = (
    value: SharedValue<number>,
    from: number,
    to: number,
    config: AnimationConfig = {}
  ) => {
    const { 
      duration = 300, 
      delay = 0, 
      easing = Easing.bezier(0.25, 0.1, 0.25, 1),
      useSpring = false,
      springConfig
    } = config;

    value.value = from;
    
    if (useSpring) {
      value.value = withDelay(
        delay, 
        withSpring(to, springConfig)
      );
    } else {
      value.value = withDelay(
        delay,
        withTiming(to, {
          duration,
          easing,
        })
      );
    }
  };

  const value = {
    fadeIn,
    fadeOut,
    slideIn,
    slideOut,
    scale,
    createOpacity,
    createTranslation,
    createScale,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}; 