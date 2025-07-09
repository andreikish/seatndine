type AppRouteParams = {
  '(tabs)': undefined;
  '(auth)': undefined;
  'restaurant/[id]': { id: string };
  'reservation/[id]': { id: string; tableId: string };
  'profile': undefined;

  '(auth)/index': undefined;
  '(auth)/sign-in': undefined;
  '(auth)/sign-up': undefined;
  '(auth)/forgot-password': undefined;
  '(auth)/reset-password': undefined;

  '(tabs)/index': undefined;
  '(tabs)/favorites': undefined;
};

const routes = {
  tabs: '(tabs)',
  auth: '(auth)',
  restaurant: (id: string) => `restaurant/${id}`,
  reservation: (id: string, tableId: string) => `reservation/${id}?tableId=${tableId}`,
  profile: 'profile',

  signIn: '(auth)/sign-in',
  signUp: '(auth)/sign-up',

  home: '(tabs)/index',
  favorites: '(tabs)/favorites',
} as const;

export default routes; 