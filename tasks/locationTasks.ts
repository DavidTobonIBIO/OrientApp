import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { Station, Route } from '@/context/AppContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL || 'http://localhost:8000/api';

// Global state to store location and station data
export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface StationData {
  station: Station | null;
  arrivingRoutes: Route[];
  lastUpdated: Date | null;
}

// Global state for other components to access
export const globalLocationData: LocationData = {
  latitude: 0,
  longitude: 0,
};

export const globalStationData: StationData = {
  station: null,
  arrivingRoutes: [],
  lastUpdated: null,
};

let locationSubscription: Location.LocationSubscription | null = null;
let stationFetchInterval: NodeJS.Timeout | null = null;
let isInitialized = false;

/**
 * Request location permissions
 */
export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    // Request foreground permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.error('Foreground location permission not granted!');
      return false;
    }

    // Request background permissions
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.error('Background location permission not granted!');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
};

/**
 * Initialize location tracking
 */
export const startLocationTracking = async (): Promise<boolean> => {
  try {
    if (!await requestLocationPermissions()) {
      return false;
    }

    // Get initial position
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });

    if (position && position.coords) {
      globalLocationData.latitude = position.coords.latitude;
      globalLocationData.longitude = position.coords.longitude;
      
      // Fetch initial station data
      fetchNearestStation();
    }

    // Clean up existing subscription if it exists
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    // Start location tracking
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,  // Update every 5 seconds
        distanceInterval: 10, // Or when moved 10 meters
      },
      (location) => {
        globalLocationData.latitude = location.coords.latitude;
        globalLocationData.longitude = location.coords.longitude;
        
        // Optionally fetch station when location changes significantly
        // This is in addition to the regular interval fetching
        fetchNearestStation();
      }
    );

    return true;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    return false;
  }
};

/**
 * Fetch nearest station based on current location
 */
export const fetchNearestStation = async (): Promise<void> => {
  try {
    const { latitude, longitude } = globalLocationData;
    
    // Skip if we don't have valid coordinates
    if (latitude === 0 && longitude === 0) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/stations/nearest_station`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const station: Station = await response.json();
    
    // Update global state
    globalStationData.station = station;
    globalStationData.arrivingRoutes = station.arrivingRoutes || [];
    globalStationData.lastUpdated = new Date();
    
    // Notify any registered listeners (if we implement that later)
    notifyListeners();
    
  } catch (error) {
    console.error('Error fetching nearest station:', error);
  }
};

// Simple observer pattern implementation
const listeners: Set<() => void> = new Set();

export const addStationDataListener = (callback: () => void): () => void => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

const notifyListeners = () => {
  listeners.forEach(callback => callback());
};

/**
 * Start regular station data fetching
 */
export const startStationFetching = (intervalMs = 15000): void => {
  if (stationFetchInterval) {
    clearInterval(stationFetchInterval);
  }

  stationFetchInterval = setInterval(fetchNearestStation, intervalMs);
};

/**
 * Stop location tracking and station fetching
 */
export const stopBackgroundTasks = (): void => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }

  if (stationFetchInterval) {
    clearInterval(stationFetchInterval);
    stationFetchInterval = null;
  }
};

/**
 * Initialize all background tasks
 */
export const initializeBackgroundTasks = async (): Promise<boolean> => {
  if (isInitialized) return true;
  
  try {
    const locationStarted = await startLocationTracking();
    if (locationStarted) {
      startStationFetching();
      isInitialized = true;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error initializing background tasks:', error);
    return false;
  }
};

