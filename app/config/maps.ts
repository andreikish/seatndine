import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.googleMapsApiKey;
console.log('Google Maps API Key from config:', apiKey);

export const GOOGLE_MAPS_API_KEY = apiKey || '';

export const defaultMapConfig = {
  initialRegion: {
    latitude: 46.7712,
    longitude: 23.6236,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  mapStyle: [
    {
      featureType: 'poi',
      elementType: 'labels.text',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi.business',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export default defaultMapConfig; 