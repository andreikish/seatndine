export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  image: string;
  rating: number;
  distance: string;
  phone: string;
  website: string;
  features: string[];
  photos: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  cuisine: string;
  priceRange: string;
  discount?: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
  };
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  tables: {
    interior: {
      id: string;
      seats: number;
      isAvailable: boolean;
    }[];
    exterior: {
      id: string;
      seats: number;
      isAvailable: boolean;
    }[];
  };
  menuPdf?: string;
}

const defaultRestaurant: Restaurant = {
  id: '',
  name: '',
  description: '',
  address: '',
  image: '',
  rating: 0,
  distance: '',
  phone: '',
  website: '',
  features: [],
  photos: [],
  coordinates: {
    latitude: 0,
    longitude: 0,
  },
  cuisine: '',
  priceRange: '',
  status: '',
  location: {
    latitude: 0,
    longitude: 0,
  },
  openingHours: {},
  tables: {
    interior: [],
    exterior: []
  },
  menuPdf: '',
};

export default defaultRestaurant; 