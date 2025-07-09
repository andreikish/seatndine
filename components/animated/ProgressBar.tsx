import React, { useEffect } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface ProgressBarProps extends ViewProps {
  progress?: number;
  duration?: number;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  animated?: boolean;
}

const ProgressBar = ({
  progress = 0,
  duration = 300,
  height = 3,
  backgroundColor,
  progressColor,
  animated = true,
  style,
  ...props
}: ProgressBarProps) => {
  const { colors } = useTheme();
  const widthAnim = useSharedValue(0);

  const bgColor = backgroundColor || colors.border;
  const fgColor = progressColor || colors.primary;

  useEffect(() => {
    if (animated) {
      widthAnim.value = withTiming(progress, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      widthAnim.value = progress;
    }
  }, [progress, animated, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${widthAnim.value * 100}%`,
    };
  });

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: bgColor, height },
        style
      ]} 
      {...props}
    >
      <Animated.View
        style={[
          styles.progress,
          { backgroundColor: fgColor },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
  },
});

export default ProgressBar; 