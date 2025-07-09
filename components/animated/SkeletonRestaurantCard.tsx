import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import SkeletonLoader from './SkeletonLoader';
import { FadeIn } from './FadeIn';

interface SkeletonRestaurantCardProps {
  showImageSize?: 'small' | 'large';
  delay?: number;
}

export const SkeletonRestaurantCard: React.FC<SkeletonRestaurantCardProps> = ({
  showImageSize = 'small',
  delay = 0
}) => {
  const { colors, isDarkMode } = useTheme();
  const imageHeight = showImageSize === 'small' ? 80 : 150;

  return (
    <FadeIn delay={delay} from="bottom">
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <SkeletonLoader 
          height={imageHeight} 
          width="100%" 
          borderRadius={8} 
          style={styles.image}
        />
        <View style={styles.content}>
          <View style={styles.info}>
            <SkeletonLoader 
              height={18} 
              width="70%" 
              borderRadius={4} 
              style={styles.title}
            />
            <View style={styles.ratingRow}>
              <SkeletonLoader 
                height={14} 
                width={20} 
                borderRadius={4} 
                style={styles.starIcon}
              />
              <SkeletonLoader 
                height={14} 
                width={30} 
                borderRadius={4} 
                style={styles.rating}
              />
            </View>
          </View>
          <SkeletonLoader 
            height={16} 
            width="40%" 
            borderRadius={4} 
            style={styles.cuisine}
          />
          <SkeletonLoader 
            height={16} 
            width="55%" 
            borderRadius={4} 
            style={styles.discount}
          />
        </View>
      </View>
    </FadeIn>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
  },
  content: {
    padding: 12,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 4,
  },
  rating: {
    marginLeft: 2,
  },
  cuisine: {
    marginBottom: 8,
  },
  discount: {
    marginTop: 4,
  },
});

export default SkeletonRestaurantCard; 