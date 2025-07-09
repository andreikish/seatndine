export interface Reservation {
  id: string;
  restaurantId: string;
  userId: string;
  userName: string;
  date: string;
  guests: number;
  tableId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
} 