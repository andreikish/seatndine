import React, { useEffect } from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withDelay,
  Easing
} from 'react-native-reanimated';

type TransitionType = 'fadeIn' | 'slideInRight' | 'slideInLeft' | 'slideInUp' | 'slideInDown' | 'zoomIn';

interface PageTransitionProps extends ViewProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  delay?: number;
  enabled?: boolean;
  onAnimationComplete?: () => void;
}

const AnimatedPage = ({
  children,
  type = 'fadeIn',
  duration = 350,
  delay = 0,
  style,
  enabled = true,
  onAnimationComplete,
  ...props
}: PageTransitionProps) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const timingConfig = {
    duration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  };

  useEffect(() => {
    if (enabled) {
      let animations: any[] = [];

      switch (type) {
        case 'fadeIn':
          opacity.value = 0;
          animations.push(() => {
            opacity.value = withDelay(delay, withTiming(1, timingConfig));
          });
          break;
        case 'slideInRight':
          opacity.value = 0;
          translateX.value = 100;
          animations.push(() => {
            opacity.value = withDelay(delay, withTiming(1, timingConfig));
            translateX.value = withDelay(delay, withTiming(0, timingConfig));
          });
          break;
        case 'slideInLeft':
          opacity.value = 0;
          translateX.value = -100;
          animations.push(() => {
            opacity.value = withDelay(delay, withTiming(1, timingConfig));
            translateX.value = withDelay(delay, withTiming(0, timingConfig));
          });
          break;
        case 'slideInUp':
          opacity.value = 0;
          translateY.value = 100;
          animations.push(() => {
            opacity.value = withDelay(delay, withTiming(1, timingConfig));
            translateY.value = withDelay(delay, withTiming(0, timingConfig));
          });
          break;
        case 'slideInDown':
          opacity.value = 0;
          translateY.value = -100;
          animations.push(() => {
            opacity.value = withDelay(delay, withTiming(1, timingConfig));
            translateY.value = withDelay(delay, withTiming(0, timingConfig));
          });
          break;
        case 'zoomIn':
          opacity.value = 0;
          scale.value = 0.8;
          animations.push(() => {
            opacity.value = withDelay(delay, withTiming(1, timingConfig));
            scale.value = withDelay(delay, withTiming(1, timingConfig));
          });
          break;
        default:
          opacity.value = 0;
          animations.push(() => {
            opacity.value = withDelay(delay, withTiming(1, timingConfig));
          });
      }

      animations.forEach(animate => animate());

      const timeoutId = setTimeout(() => {
        onAnimationComplete?.();
      }, duration + delay);

      return () => clearTimeout(timeoutId);
    }
  }, [enabled, type, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AnimatedPage; 