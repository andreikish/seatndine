import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  '(tabs)': NavigatorScreenParams<TabStackParamList>;
  'restaurant': { id: string };
  'reservation': { restaurantId: string; tableId: string };
  'profile': undefined;
};

export type TabStackParamList = {
  'index': undefined;
  'favorites': undefined;
  'map': undefined;
  'reservations': undefined;
  'statistics': undefined;
  'settings': undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 