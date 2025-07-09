import { Restaurant } from '@/types';

export const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Restaurant La Plăcinte',
    description: 'Restaurant tradițional românesc cu cele mai bune plăcinte din oraș. Specialități tradiționale și preparate autentice.',
    address: 'Strada Principală 123, București',
    image: 'https://example.com/la-placinte.jpg',
    rating: 4.5,
    cuisine: 'Românească',
    priceRange: '$$',
    openingHours: '09:00 - 22:00',
    phone: '+40 123 456 789',
    website: 'www.laplacinte.ro',
    coordinates: {
      latitude: 44.4268,
      longitude: 26.1025
    }
  },
  {
    id: '2',
    name: 'Pizzeria Bella Italia',
    description: 'Pizzeria autentică italiană cu ingrediente importate direct din Italia. Pizza preparată în cuptor cu lemn.',
    address: 'Strada Italiana 45, București',
    image: 'https://example.com/bella-italia.jpg',
    rating: 4.8,
    cuisine: 'Italiană',
    priceRange: '$$$',
    openingHours: '11:00 - 23:00',
    phone: '+40 987 654 321',
    website: 'www.bellaitalia.ro',
    coordinates: {
      latitude: 44.4325,
      longitude: 26.1038
    }
  }
]; 