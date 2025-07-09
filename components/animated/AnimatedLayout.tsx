import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface AnimatedLayoutProps extends ViewProps {
  children: React.ReactNode;
  animateOnMount?: boolean;
  duration?: number;
  entryAnimation?: 'fade' | 'slide-up' | 'slide-in-right' | 'zoom';
  exitAnimation?: 'fade' | 'slide-down' | 'slide-out-left' | 'zoom-out';
  delay?: number;
  contentVisible?: boolean;
}

const getEntryValues = (type: AnimatedLayoutProps['entryAnimation']) => {
  switch (type) {
    case 'slide-up':
      return { opacity: 0, translateY: 30, translateX: 0, scale: 1 };
    case 'slide-in-right':
      return { opacity: 0, translateY: 0, translateX: 50, scale: 1 };
    case 'zoom':
      return { opacity: 0, translateY: 0, translateX: 0, scale: 0.9 };
    case 'fade':
    default:
      return { opacity: 0, translateY: 0, translateX: 0, scale: 1 };
  }
};

const getExitValues = (type: AnimatedLayoutProps['exitAnimation']) => {
  switch (type) {
    case 'slide-down':
      return { opacity: 0, translateY: 30, translateX: 0, scale: 1 };
    case 'slide-out-left':
      return { opacity: 0, translateY: 0, translateX: -50, scale: 1 };
    case 'zoom-out':
      return { opacity: 0, translateY: 0, translateX: 0, scale: 0.9 };
    case 'fade':
    default:
      return { opacity: 0, translateY: 0, translateX: 0, scale: 1 };
  }
};

const AnimatedLayout = ({
  children,
  style,
  animateOnMount = true,
  duration = 350,
  entryAnimation = 'fade',
  exitAnimation = 'fade',
  delay = 0,
  contentVisible = true,
  ...props
}: AnimatedLayoutProps) => {
  const { colors } = useTheme();
  const [childContent, setChildContent] = useState<React.ReactNode>(children);
  const [renderChildren, setRenderChildren] = useState(contentVisible);
  
  const opacity = useSharedValue(contentVisible ? 1 : 0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const showContent = () => {
    setRenderChildren(true);
  };

  const hideContent = () => {
    setRenderChildren(false);
  };

  const animationConfig = {
    duration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  };

  useEffect(() => {
    if (animateOnMount && contentVisible) {
      const entryValues = getEntryValues(entryAnimation);
      opacity.value = entryValues.opacity;
      translateY.value = entryValues.translateY;
      translateX.value = entryValues.translateX;
      scale.value = entryValues.scale;

      opacity.value = withDelay(
        delay,
        withTiming(1, animationConfig)
      );
      translateY.value = withDelay(
        delay,
        withTiming(0, animationConfig)
      );
      translateX.value = withDelay(
        delay,
        withTiming(0, animationConfig)
      );
      scale.value = withDelay(
        delay,
        withTiming(1, animationConfig)
      );
    }
  }, []);

  useEffect(() => {
    if (contentVisible) {
      setChildContent(children);
      showContent();
      
      const entryValues = getEntryValues(entryAnimation);
      opacity.value = entryValues.opacity;
      translateY.value = entryValues.translateY;
      translateX.value = entryValues.translateX;
      scale.value = entryValues.scale;

      opacity.value = withDelay(
        delay,
        withTiming(1, animationConfig)
      );
      translateY.value = withDelay(
        delay,
        withTiming(0, animationConfig)
      );
      translateX.value = withDelay(
        delay,
        withTiming(0, animationConfig)
      );
      scale.value = withDelay(
        delay,
        withTiming(1, animationConfig)
      );
    } else {
      const exitValues = getExitValues(exitAnimation);
      
      opacity.value = withTiming(exitValues.opacity, animationConfig);
      translateY.value = withTiming(exitValues.translateY, animationConfig);
      translateX.value = withTiming(exitValues.translateX, animationConfig);
      scale.value = withTiming(exitValues.scale, {
        ...animationConfig,
        duration: animationConfig.duration,
      }, () => {
        runOnJS(hideContent)();
      });
    }
  }, [contentVisible, children]);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    };
  });

  if (!renderChildren) {
    return null;
  }

  return (
    <Animated.View 
      style={[styles.container, animatedStyles, style]}
      {...props}
    >
      {childContent}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AnimatedLayout; 