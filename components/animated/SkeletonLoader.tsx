import React, { useEffect } from 'react';
import { View, StyleSheet, ViewProps, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonLoaderProps extends ViewProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
  isLoading?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  children,
  isLoading = true,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (isLoading) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 700, easing: Easing.ease }),
          withTiming(0.3, { duration: 700, easing: Easing.ease })
        ),
        -1,
        true 
      );
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isLoading]);

  const animatedStyles = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isLoading && children) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { width, height } as ViewStyle, style]} {...props}>
      <Animated.View
        style={[
          styles.skeleton,
          { 
            width, 
            height,
            borderRadius,
            backgroundColor: isDarkMode ? '#3A3A3C' : '#E1E1E1',
          } as ViewStyle,
          animatedStyles
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  skeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default SkeletonLoader; 