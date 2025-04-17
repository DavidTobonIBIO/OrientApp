import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useStationData, useRouteArrivalTime } from '@/hooks/useStationData';
import { fetchGoogleRouteData, extractRouteArrivalTime, calculateTimeToDeparture, fetchStationById } from '@/services/api';
import { BusRoute } from '@/types/models';
import 'nativewind';

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
  const { 
    stationName, 
    arrivingRoutes, 
    currentStation,
    loading, 
    error 
  } = useStationData();
  
  const { arrivalTimes, updateArrivalTime } = useRouteArrivalTime();
  const [destinationNames, setDestinationNames] = useState<{[routeId: number]: string}>({});
  const [loadingDestinations, setLoadingDestinations] = useState<{[routeId: number]: boolean}>({});

  // Function to fetch destination station name
  const fetchDestinationName = async (route: BusRoute) => {
    if (!route.destinationStationId) return;
    
    try {
      setLoadingDestinations(prev => ({...prev, [route.id]: true}));
      
      const destinationStation = await fetchStationById(route.destinationStationId);
      setDestinationNames(prev => ({
        ...prev,
        [route.id]: destinationStation.name
      }));
    } catch (err) {
      console.log(`Error fetching destination for route ${route.name}:`, err);
    } finally {
      setLoadingDestinations(prev => ({...prev, [route.id]: false}));
    }
  };

  // Function to fetch Google Maps route data for a specific route
  const fetchRouteArrivalTime = async (route: BusRoute, destinationStationId: number) => {
    try {
      // Initialize arrival time state for this route
      updateArrivalTime(route.id, { loading: true });

      // Get current station coordinates
      if (!currentStation) {
        throw new Error('Current station not available');
      }

      // Get destination station
      const destinationStation = await fetchStationById(destinationStationId);
      
      // Make request to Google Maps Routes API
      const data = await fetchGoogleRouteData(
        currentStation.coordinates.latitude,
        currentStation.coordinates.longitude,
        destinationStation.coordinates.latitude,
        destinationStation.coordinates.longitude
      );
      
      // Extract arrival time for this route
      const departureTime = extractRouteArrivalTime(data, route.name);
      
      if (departureTime) {
        const timeInMinutes = calculateTimeToDeparture(departureTime);
        updateArrivalTime(route.id, { 
          time: timeInMinutes.toString(), 
          loading: false 
        });
      } else {
        throw new Error('No arrival information found');
      }
    } catch (err: any) {
      console.log(`Error fetching arrival time for route ${route.name}:`, err);
      updateArrivalTime(route.id, { 
        error: err.message || 'Error al obtener el tiempo de llegada', 
        loading: false 
      });
    }
  };

  // Fetch arrival times and destination names when routes change
  useEffect(() => {
    if (arrivingRoutes && arrivingRoutes.length > 0 && currentStation) {
      arrivingRoutes.forEach(route => {
        if (route.destinationStationId) {
          fetchRouteArrivalTime(route, route.destinationStationId);
          fetchDestinationName(route);
        }
      });
    }
  }, [arrivingRoutes, currentStation]);

  // Render destination station name
  const renderDestination = (routeId: number) => {
    const destinationName = destinationNames[routeId];
    const isLoading = loadingDestinations[routeId];
    
    if (isLoading) {
      return (
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#4B5563" />
          <Text className="text-green-700 ml-2">Cargando destino...</Text>
        </View>
      );
    }
    
    if (!destinationName) {
      return <Text className="text-green-700">Desconocido</Text>;
    }
    
    return <Text className="text-green-700">{destinationName}</Text>;
  };

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
                    Destino: {renderDestination(item.id)}
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
