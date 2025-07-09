export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  image: string;
  rating: number;
  cuisine: string;
  priceRange: string;
  openingHours: string;
  phone: string;
  website?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export * from './restaurant';
export * from './review';
export * from './reservation';
export * from './navigation'; 