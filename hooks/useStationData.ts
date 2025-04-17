import { useState, useEffect, useCallback } from 'react';
import { globalLocationData, globalCurrentStationData, addStationDataListener } from '@/tasks/locationTasks';
import { fetchStationById } from '@/services/api';
import { 
  BusRoute, 
  Station, 
  RouteWithDestination, 
  UseStationDataProps, 
  UseStationDataReturn,
  ArrivalTimeInfo,
  ArrivalTimesMap
} from '@/types/models';

/**
 * Custom hook for handling station data with optional destination loading
 */
export const useStationData = ({ 
  loadDestinations = false 
}: UseStationDataProps = {}): UseStationDataReturn => {
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [arrivingRoutes, setArrivingRoutes] = useState<BusRoute[]>([]);
  const [stationName, setStationName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [locationAvailable, setLocationAvailable] = useState<boolean>(false);
  const [routesWithDestinations, setRoutesWithDestinations] = useState<RouteWithDestination[]>([]);

  // Function to fetch destination details for routes
  const fetchDestinationDetails = async (routes: BusRoute[]) => {
    if (!routes || routes.length === 0) return [];
    
    try {
      const promises = routes
        .filter((route: BusRoute) => route.destinationStationId > 0)
        .map(async (route: BusRoute) => {
          try {
            const destination = await fetchStationById(route.destinationStationId);
            return { route, destination };
          } catch (err) {
            console.log(`Error fetching destination for route ${route.name}:`, err);
            return null;
          }
        });
        
      const results = await Promise.all(promises);
      return results.filter((item: any): item is RouteWithDestination => item !== null);
    } catch (error) {
      console.log('Error fetching destination details:', error);
      return [];
    }
  };

  // Update component state with global station data
  const updateFromGlobalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { station, arrivingRoutes: routes } = globalCurrentStationData;
      const { latitude, longitude } = globalLocationData;
      
      // Check if location data is available
      setLocationAvailable(latitude !== 0 || longitude !== 0);
      
      if (station) {
        setCurrentStation(station);
        setStationName(station.name);
        setArrivingRoutes(routes);
        
        // Fetch destination details if needed
        if (loadDestinations && routes && routes.length > 0) {
          const destinations = await fetchDestinationDetails(routes);
          setRoutesWithDestinations(destinations);
        }
        
        setError(null);
      } else {
        setCurrentStation(null);
        setStationName(null);
        setArrivingRoutes([]);
        setRoutesWithDestinations([]);
        
        if (locationAvailable) {
          setError('No se encontró ninguna estación cercana');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Algo salió mal');
    } finally {
      setLoading(false);
    }
  }, [locationAvailable, loadDestinations]);

  // Subscribe to global station data updates
  useEffect(() => {
    // Initial update from global data
    updateFromGlobalData();
    
    // Register listener for updates
    const removeListener = addStationDataListener(updateFromGlobalData);
    
    // Cleanup listener on unmount
    return () => {
      removeListener();
    };
  }, [updateFromGlobalData]);

  return {
    currentStation,
    arrivingRoutes,
    stationName,
    loading,
    error,
    locationAvailable,
    routesWithDestinations,
    refreshStationData: updateFromGlobalData
  };
};

/**
 * Hook for getting arrival time information for routes
 */
export const useRouteArrivalTime = () => {
  const [arrivalTimes, setArrivalTimes] = useState<ArrivalTimesMap>({});

  const updateArrivalTime = (
    routeId: number, 
    data: { time?: string | null; error?: string | null; loading?: boolean }
  ) => {
    setArrivalTimes(prev => ({
      ...prev,
      [routeId]: {
        time: data.time ?? prev[routeId]?.time ?? null,
        error: data.error ?? prev[routeId]?.error ?? null,
        loading: data.loading ?? prev[routeId]?.loading ?? false
      }
    }));
  };

  return {
    arrivalTimes,
    updateArrivalTime
  };
}; 