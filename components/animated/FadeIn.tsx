import React, { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

type FadeInProps = ViewProps & {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  from?: 'bottom' | 'top' | 'left' | 'right' | 'none';
  distance?: number;
  enabled?: boolean;
};

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  duration = 500,
  delay = 0,
  from = 'none',
  distance = 20,
  enabled = true,
  style,
  ...props
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(from === 'bottom' ? distance : from === 'top' ? -distance : 0);
  const translateX = useSharedValue(from === 'right' ? distance : from === 'left' ? -distance : 0);

  const animations = {
    duration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  };

  useEffect(() => {
    if (enabled) {
      opacity.value = withDelay(
        delay,
        withTiming(1, animations)
      );
  
      if (from === 'bottom' || from === 'top') {
        translateY.value = withDelay(
          delay,
          withTiming(0, animations)
        );
      }
  
      if (from === 'left' || from === 'right') {
        translateX.value = withDelay(
          delay,
          withTiming(0, animations)
        );
      }
    }
  }, [enabled, opacity, translateY, translateX, delay, from, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
      ],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}; 