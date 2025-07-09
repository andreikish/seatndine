import React, { useEffect } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

type TransitionType = 'fade' | 'slide-horizontal' | 'slide-vertical' | 'scale';

interface ScreenTransitionProps extends ViewProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  enabled?: boolean;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  type = 'fade',
  duration = 300,
  enabled = true,
  style,
  ...props
}) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const initialValues = () => {
    switch (type) {
      case 'slide-horizontal':
        opacity.value = 0;
        translateX.value = 100;
        break;
      case 'slide-vertical':
        opacity.value = 0;
        translateY.value = 50;
        break;
      case 'scale':
        opacity.value = 0;
        scale.value = 0.9;
        break;
      case 'fade':
      default:
        opacity.value = 0;
    }
  };

  const animate = () => {
    const config = {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    };

    opacity.value = withTiming(1, config);
    
    if (type === 'slide-horizontal') {
      translateX.value = withTiming(0, config);
    } else if (type === 'slide-vertical') {
      translateY.value = withTiming(0, config);
    } else if (type === 'scale') {
      scale.value = withTiming(1, config);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (enabled) {
        initialValues();
        animate();
      }
    }, [enabled, type, duration])
  );

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