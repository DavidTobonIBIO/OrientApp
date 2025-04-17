import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Route, Station } from '@/context/AppContext';
import { globalStationData, addStationDataListener } from '@/tasks/locationTasks';
import 'nativewind';

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL || 'http://localhost:8000/api';

interface DestinationMap {
  [routeId: number]: string;
}

const EasyGuide = () => {
  const [arrivingRoutes, setArrivingRoutes] = useState<Route[]>([]);
  const [destinationNames, setDestinationNames] = useState<DestinationMap>({});
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

  // Function to fetch destination stations for all routes
  const fetchDestinationStations = async (routes: Route[]) => {
    try {
      const destinations: DestinationMap = {};
      
      // Create an array of promises for fetching all destination stations
      const promises = routes.map(async (route) => {
        try {
          if (route.destinationStationId) {
            const station = await fetchStationById(route.destinationStationId);
            destinations[route.id] = station.name;
          }
        } catch (err) {
          console.error(`Failed to fetch destination for route ${route.id}:`, err);
        }
      });
      
      // Wait for all requests to complete
      await Promise.all(promises);
      
      // Update state with all destination names
      setDestinationNames(destinations);
    } catch (err) {
      console.error('Error fetching destination stations:', err);
    }
  };

  // Update component state with global station data
  const updateFromGlobalData = () => {
    try {
      setLoading(true);
      setError(null);
      
      const { station, arrivingRoutes: routes } = globalStationData;
      
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
            <View className="px-6">
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
