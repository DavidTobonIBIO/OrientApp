import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { BusRoute, Station } from '@/context/AppContext';
import { globalCurrentStationData, addStationDataListener } from '@/tasks/locationTasks';
import 'nativewind';

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL || 'http://localhost:8000/api';
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

interface DestinationMap {
  [routeId: number]: string;
}

interface ArrivalTimeMap {
  [routeId: number]: {
    time: string | null;
    error: string | null;
    loading: boolean;
  };
}

const EasyGuide = () => {
  const [arrivingRoutes, setArrivingRoutes] = useState<BusRoute[]>([]);
  const [destinationNames, setDestinationNames] = useState<DestinationMap>({});
  const [arrivalTimes, setArrivalTimes] = useState<ArrivalTimeMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stationName, setStationName] = useState<string | null>(null);

  // Function to fetch station by ID
  const fetchStationById = async (stationId: number): Promise<Station> => {
    const response = await fetch(`${API_BASE_URL}/stations/${stationId}`);
    if (!response.ok) {
      throw new Error(`Error fetching station with ID: ${stationId}`);
    }
    return await response.json();
  };

  // Function to fetch Google Maps route data for a specific route
  const fetchGoogleRouteData = async (route: BusRoute, destinationStation: Station) => {
    try {
      // Initialize arrival time state for this route
      setArrivalTimes(prev => ({
        ...prev,
        [route.id]: { time: null, error: null, loading: true }
      }));

      // Get current station coordinates
      const currentStation = globalCurrentStationData.station;
      if (!currentStation) {
        throw new Error('Current station not available');
      }

      // Make request to Google Maps Routes API
      const response = await fetch(GOOGLE_MAPS_ROUTES_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY!,
          "X-Goog-FieldMask": "routes.legs",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: currentStation.coordinates.latitude,
                longitude: currentStation.coordinates.longitude
              }
            }
          },
          destination: {
            location: {
              latLng: {
                latitude: destinationStation.coordinates.latitude,
                longitude: destinationStation.coordinates.longitude
              }
            }
          },
          travelMode: "TRANSIT",
          computeAlternativeRoutes: true
        })
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract arrival time for this route
      extractRouteArrivalTime(data, route);
    } catch (err: any) {
      console.log(`Error fetching arrival time for route ${route.name}:`, err);
      setArrivalTimes(prev => ({
        ...prev,
        [route.id]: { 
          time: null, 
          error: err.message || 'Error al obtener el tiempo de llegada', 
          loading: false 
        }
      }));
    }
  };

  // Extract arrival time from Google Maps response
  const extractRouteArrivalTime = (data: any, route: BusRoute) => {
    try {
      for (const googleRoute of data.routes || []) {
        for (const leg of googleRoute.legs || []) {
          for (const step of leg.steps || []) {
            if (
              step.travelMode === "TRANSIT" &&
              step.transitDetails?.transitLine?.nameShort === route.name
            ) {
              const departureTime = step.transitDetails?.localizedValues?.departureTime?.time?.text;
              if (departureTime) {
                calculateTimeToDeparture(route.id, departureTime);
                return;
              }
            }
          }
        }
      }
      throw new Error('No arrival information found');
    } catch (err: any) {
      setArrivalTimes(prev => ({
        ...prev,
        [route.id]: { 
          time: null, 
          error: err.message || 'Información no disponible', 
          loading: false 
        }
      }));
    }
  };

  // Calculate time to departure
  const calculateTimeToDeparture = (routeId: number, departureTime: string) => {
    try {
      const now = new Date();
      const [hours, minutes] = departureTime.split(':').map(Number);
      const departure = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      
      // If the calculated time is in the past, it might be for tomorrow
      if (departure < now) {
        departure.setDate(departure.getDate() + 1);
      }
      
      const diffMinutes = Math.round((departure.getTime() - now.getTime()) / (1000 * 60));
      
      setArrivalTimes(prev => ({
        ...prev,
        [routeId]: { 
          time: diffMinutes.toString(), 
          error: null, 
          loading: false 
        }
      }));
    } catch (err) {
      console.log(`Error calculating time for route ${routeId}:`, err);
      setArrivalTimes(prev => ({
        ...prev,
        [routeId]: { 
          time: null, 
          error: 'Error al calcular tiempo', 
          loading: false 
        }
      }));
    }
  };

  // Function to fetch destination stations for all routes
  const fetchDestinationStations = async (routes: BusRoute[]) => {
    try {
      const destinations: DestinationMap = {};
      
      // Create an array of promises for fetching all destination stations
      const promises = routes.map(async (route) => {
        try {
          if (route.destinationStationId) {
            const station = await fetchStationById(route.destinationStationId);
            destinations[route.id] = station.name;
            
            // Fetch arrival time for this route
            fetchGoogleRouteData(route, station);
          }
        } catch (err) {
          console.log(`Failed to fetch destination for route ${route.id}:`, err);
        }
      });
      
      // Wait for all requests to complete
      await Promise.all(promises);
      
      // Update state with all destination names
      setDestinationNames(destinations);
    } catch (err) {
      console.log('Error fetching destination stations:', err);
    }
  };

  // Update component state with global station data
  const updateFromGlobalData = () => {
    try {
      setLoading(true);
      setError(null);
      
      const { station, arrivingRoutes: routes } = globalCurrentStationData;
      
      if (station) {
        setStationName(station.name);
        setArrivingRoutes(routes);
        
        // Fetch destination station names for all routes
        if (routes && routes.length > 0) {
          fetchDestinationStations(routes);
        }
        
        setError(null);
      } else {
        setError('No se encontró ninguna estación cercana');
      }
    } catch (err: any) {
      setError(err.message || 'Algo salió mal');
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

  // Render arrival time information
  const renderArrivalTime = (routeId: number) => {
    const timeData = arrivalTimes[routeId];
    
    if (!timeData) {
      return <Text className="text-2xl text-gray-600">Tiempo: Cargando...</Text>;
    }
    
    if (timeData.loading) {
      return (
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#4B5563" />
          <Text className="text-2xl text-gray-600 ml-2">Tiempo: Cargando...</Text>
        </View>
      );
    }
    
    if (timeData.error) {
      return <Text className="text-2xl text-orange-600">Tiempo: No disponible</Text>;
    }
    
    return (
      <Text className="text-2xl text-purple-700 font-bold">
        Llega en {timeData.time} minutos
      </Text>
    );
  };

  return (
    <SafeAreaView className="bg-white h-full">

      {/* Container with fixed position */}
      <View className="w-full justify-center items-center absolute top-0 left-0 right-0 bg-white z-10 py-4 px-4">
        {/* Title */}
        <Text className="font-bold text-5xl my-6 text-center">
          Orienta Fácil
        </Text>

        {/* Loading / Error Message */}
        {loading && (
          <Text className="text-3xl font-bold text-gray-700 text-center">
            Cargando información de la estación...
          </Text>
        )}
        {error && (
          <Text className="text-3xl font-bold text-red-600 text-center">
            Error: {error}
          </Text>
        )}

        {/* Station Information */}
        {!loading && !error && (
          <Text className="text-4xl font-bold text-gray-900 text-center my-4">
            Rutas que están llegando a <Text className="text-blue-700">{stationName}</Text>:
          </Text>
        )}
      </View>

      {/* Spacer to push content below the fixed header */}
      <View className="h-64" />

      {/* Arriving Routes List */}
      <View className="flex-1">
        <ScrollView
          className="w-full"
          contentContainerStyle={{ paddingVertical: 10 }}
          showsVerticalScrollIndicator={true}
        >
          {!loading && (
            <View className="px-6 mt-10">
              {arrivingRoutes.map((item, index) => (
                <View
                  key={index}
                  className="my-4 p-6 border-4 border-gray-600 rounded-xl"
                >
                  <Text className="text-3xl font-bold text-gray-900">
                    Ruta: <Text className="text-blue-700">{item.name}</Text>
                  </Text>
                  <Text className="text-3xl text-gray-800">
                    Destino: <Text className="text-green-700">{destinationNames[item.id] || 'Cargando...'}</Text>
                  </Text>
                  {renderArrivalTime(item.id)}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
      <View className="w-full flex-row justify-center mt-8 mb-4 px-4">
        <TouchableOpacity
          className="bg-red-800 py-11 rounded-2xl w-2/5 mx-2"
          onPress={() => router.replace("/")}
        >
          <Text className="text-white text-center text-3xl font-bold">Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EasyGuide;
