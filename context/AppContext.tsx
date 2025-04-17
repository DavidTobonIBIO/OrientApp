import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import { 
  globalLocationData, 
  globalStationData, 
  initializeBackgroundTasks,
  addStationDataListener,
  fetchNearestStation
} from '@/tasks/locationTasks';

// API URL
const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL || 'http://localhost:8000/api';

// Types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData extends Coordinates {}

export interface Route {
  id: number;
  name: string;
  destinationStationId: number;
}

export interface Station {
  id: number;
  name: string;
  coordinates: Coordinates;
  arrivingRoutes: Route[];
}

export interface RouteWithDestination {
  route: Route;
  destination: Station;
}

interface AppContextType {
  // Location state
  locationData: LocationData | null;
  locationPermissionGranted: boolean;
  locationError: string | null;
  locationLoading: boolean;
  
  // Station and routes state
  currentStation: Station | null;
  availableRoutes: Route[];
  routesWithDestinations: RouteWithDestination[];
  stationsLoading: boolean;
  stationsError: string | null;
  
  // Methods
  initializeLocation: () => Promise<boolean>;
  refreshStationData: () => Promise<void>;
}

// Default context value
const AppContext = createContext<AppContextType>({
  // Location state
  locationData: null,
  locationPermissionGranted: false,
  locationError: null,
  locationLoading: false,
  
  // Station and routes state
  currentStation: null,
  availableRoutes: [],
  routesWithDestinations: [],
  stationsLoading: false,
  stationsError: null,
  
  // Methods
  initializeLocation: async () => false,
  refreshStationData: async () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  // Location state
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Station and routes state
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [routesWithDestinations, setRoutesWithDestinations] = useState<RouteWithDestination[]>([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsError, setStationsError] = useState<string | null>(null);

  /**
   * Initialize location services and request permissions
   */
  const initializeLocation = useCallback(async (): Promise<boolean> => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      
      // Use the background tasks initialization
      const success = await initializeBackgroundTasks();
      
      if (success) {
        setLocationPermissionGranted(true);
        setLocationLoading(false);
        return true;
      }
      
      setLocationError('No se pudo inicializar los servicios de ubicación');
      setLocationLoading(false);
      return false;
    } catch (error) {
      console.error('Error initializing location:', error);
      setLocationError('Error al inicializar los servicios de ubicación');
      setLocationLoading(false);
      return false;
    }
  }, []);

  /**
   * Fetch station by ID
   */
  const fetchStationById = async (stationId: number): Promise<Station> => {
    try {
      const response = await fetch(`${API_BASE_URL}/stations/${stationId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching station with ID: ${stationId}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching station with ID ${stationId}:`, error);
      throw error;
    }
  };

  /**
   * Fetch destination details for routes
   */
  const fetchDestinationDetails = async (routes: Route[]) => {
    if (!routes || routes.length === 0) return [];
    
    try {
      const promises = routes
        .filter((route: Route) => route.destinationStationId > 0)
        .map(async (route: Route) => {
          try {
            const destination = await fetchStationById(route.destinationStationId);
            return { route, destination };
          } catch (err) {
            console.warn(`Error fetching destination for route ${route.name}:`, err);
            return null;
          }
        });
        
      const results = await Promise.all(promises);
      return results.filter((item: any): item is RouteWithDestination => item !== null);
    } catch (error) {
      console.error('Error fetching destination details:', error);
      return [];
    }
  };

  /**
   * Refresh station data from the global data
   */
  const refreshStationData = useCallback(async () => {
    try {
      setStationsLoading(true);
      setStationsError(null);
      
      // Trigger a fetch in the background
      fetchNearestStation();
      
      // Use the current global data
      const station = globalStationData.station;
      const routes = globalStationData.arrivingRoutes;
      
      if (station) {
        setCurrentStation(station);
        setAvailableRoutes(routes || []);
        
        // Fetch destination details
        const destinations = await fetchDestinationDetails(routes);
        setRoutesWithDestinations(destinations);
      }
    } catch (error) {
      console.error('Error refreshing station data:', error);
      setStationsError('Error al obtener datos de la estación');
    } finally {
      setStationsLoading(false);
    }
  }, []);

  // Update location data from global state
  useEffect(() => {
    const updateLocationData = () => {
      if (globalLocationData.latitude !== 0 || globalLocationData.longitude !== 0) {
        setLocationData({
          latitude: globalLocationData.latitude,
          longitude: globalLocationData.longitude
        });
      }
    };
    
    // Initial update
    updateLocationData();
    
    // Set up an interval to check for updates
    const intervalId = setInterval(updateLocationData, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Subscribe to station data updates
  useEffect(() => {
    const handleStationUpdate = () => {
      if (globalStationData.station) {
        setCurrentStation(globalStationData.station);
        setAvailableRoutes(globalStationData.arrivingRoutes || []);
        
        // Fetch destination details when station updates
        fetchDestinationDetails(globalStationData.arrivingRoutes)
          .then(destinations => {
            setRoutesWithDestinations(destinations);
          })
          .catch(error => {
            console.error('Error updating destination details:', error);
          });
      }
    };
    
    // Register for updates
    const removeListener = addStationDataListener(handleStationUpdate);
    
    // Initial update
    handleStationUpdate();
    
    return () => {
      removeListener();
    };
  }, []);

  // Initialize location when component mounts
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  const contextValue: AppContextType = {
    // Location state
    locationData,
    locationPermissionGranted,
    locationError,
    locationLoading,
    
    // Station and routes state
    currentStation,
    availableRoutes,
    routesWithDestinations,
    stationsLoading,
    stationsError,
    
    // Methods
    initializeLocation,
    refreshStationData,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use App context
export function useAppContext() {
  return useContext(AppContext);
} 