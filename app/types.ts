declare module 'expo-router' {
  interface RouteParams {
    '(tabs)': undefined;
    '(auth)': undefined;
    'restaurant/[id]': { id: string };
    'reservation/[id]': { id: string; tableId: string };

    '(auth)/index': undefined;
    '(auth)/sign-in': undefined;
    '(auth)/sign-up': undefined;

    '(tabs)/index': undefined;
    '(tabs)/favorites': undefined;
    '(tabs)/profile': undefined;
  }
}

export type AppRouteParams = {
  '(tabs)': undefined;
  '(auth)': undefined;
  'restaurant/[id]': { id: string };
  'reservation/[id]': { id: string; tableId: string };

  '(auth)/index': undefined;
  '(auth)/sign-in': undefined;
  '(auth)/sign-up': undefined;

  '(tabs)/index': undefined;
  '(tabs)/favorites': undefined;
  '(tabs)/profile': undefined;
};

const DummyComponent = () => null;
export default DummyComponent; 