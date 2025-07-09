import { supabase } from '@/lib/supabase';
import type { Review, ReviewInput } from '@/types/review';

export const ReviewService = {
  async getReviewsForRestaurant(restaurantId: string | number): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Review[];
  },

  async addReview(review: ReviewInput): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .insert([review]);
    if (error) throw error;
  }
}; 