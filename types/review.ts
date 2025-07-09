export type Review = {
  id: string;
  user_id: string | null;
  restaurant_id: number;
  reservation_id?: string | null;
  is_anonymous: boolean;
  general_rating: number;
  service_rating: number;
  food_rating?: number | null;
  ambiance_rating?: number | null;
  text?: string | null;
  created_at: string;
};

export type ReviewInput = {
  user_id: string | null;
  restaurant_id: number;
  reservation_id?: string | null;
  is_anonymous: boolean;
  general_rating: number;
  service_rating: number;
  food_rating?: number | null;
  ambiance_rating?: number | null;
  text?: string | null;
}; 