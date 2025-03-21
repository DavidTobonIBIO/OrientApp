import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { globalLocationData } from '@/tasks/locationTasks';
import { Link } from 'expo-router';

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;

const EasyGuide = () => {
  const [arrivingRoutes, setArrivingRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stationName, setStationName] = useState<string | null>(null);

  // Function to fetch station data
  const fetchNearestStationData = async () => {
    try {
      const requestEndpoint = `${API_BASE_URL}/stations/nearest_station`;
      const { latitude, longitude } = globalLocationData;

      console.log('Requesting data from:', requestEndpoint);
      const response = await fetch(requestEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const station = await response.json();
      setStationName(station.name);
      setArrivingRoutes(station.arrivingRoutes);
      console.log('Station:', station);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Algo salió mal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearestStationData(); // initial request
    const intervalId = setInterval(fetchNearestStationData, 15000); // every 15 seconds
    return () => clearInterval(intervalId);
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
                      Destino: <Text className="text-green-700">{item.destination}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      <View className="w-full flex-row justify-center mt-8 mb-4 px-4">
        <Link href="/" asChild>
          <TouchableOpacity className="bg-red-800 py-11 rounded-2xl w-2/5 mx-2">
            <Text className="text-white text-center text-3xl font-bold">Volver</Text>
          </TouchableOpacity>
        </Link>
    </View>
    </SafeAreaView>
  );
};

export default EasyGuide;
