import React, { createContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { LOCATION_TASK_NAME, globalLocationData } from './locationTasks';

export interface ILocationInfo {
  latitude: number;
  longitude: number;
  address?: Location.LocationGeocodedAddress;
}

interface ILocationContext {
  locationInfo: ILocationInfo | null;
}

export const LocationContext = createContext<ILocationContext>({
  locationInfo: null,
});

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locationInfo, setLocationInfo] = useState<ILocationInfo | null>(null);

  // Start background location tracking
  const startLocationTracking = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.error('Foreground location permission not granted');
      return;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.error('Background location permission not granted');
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 0,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Location Tracking',
        notificationBody: 'Your location is being tracked in the background.',
        notificationColor: '#fff',
      },
    });
  };

  const stopLocationTracking = async () => {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  };

  // Start tracking when the provider mounts and stop when unmounts
  useEffect(() => {
    startLocationTracking();
    return () => {
      stopLocationTracking();
    };
  }, []);

  // Poll the globalLocationData and update the context with reverse geocoded address
  useEffect(() => {
    const interval = setInterval(async () => {
      if (globalLocationData) {
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: globalLocationData.latitude,
            longitude: globalLocationData.longitude,
          });
          const address = reverseGeocode[0];
          setLocationInfo({
            latitude: globalLocationData.latitude,
            longitude: globalLocationData.longitude,
            address,
          });
        } catch (error) {
          console.error('Reverse geocoding error:', error);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LocationContext.Provider value={{ locationInfo }}>
      {children}
    </LocationContext.Provider>
  );
};
