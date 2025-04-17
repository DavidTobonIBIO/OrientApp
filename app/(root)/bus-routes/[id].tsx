import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { fetchGoogleRouteData, extractRouteArrivalTime, calculateTimeToDeparture } from '@/services/api';
import { BusRouteParams } from '@/types/models';

const BusRoute = () => {
  const params = useLocalSearchParams() as unknown as BusRouteParams;
  const {
    id, routeName, destinationStationLat, destinationStationLng,
    currentStationName, currentStationLat, currentStationLng
  } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeToDeparture, setTimeToDeparture] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Make sure we have all required parameters
        if (!currentStationLat || !currentStationLng || !destinationStationLat || !destinationStationLng || !routeName) {
          throw new Error('Missing required parameters');
        }

        // Fetch route data from Google Maps
        const data = await fetchGoogleRouteData(
          parseFloat(currentStationLat),
          parseFloat(currentStationLng),
          parseFloat(destinationStationLat),
          parseFloat(destinationStationLng)
        );
        
        // Extract the departure time for this route
        const departureTime = extractRouteArrivalTime(data, routeName);
        
        if (departureTime) {
          // Calculate minutes until departure
          const minutes = calculateTimeToDeparture(departureTime);
          setTimeToDeparture(minutes.toString());
        } else {
          throw new Error(`Información de la ruta ${routeName} (con id ${id}) para la estación ${currentStationName} no encontrada en los datos de Google Maps.`);
        }
      } catch (e: any) {
        setError(e.message || "Ocurrió un error inesperado.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, routeName, currentStationLat, currentStationLng, destinationStationLat, destinationStationLng, currentStationName]);

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerClassName="h-full justify-center items-center p-6">
        
        <Text className="font-bold text-5xl my-14 text-center text-blue-900">
          Información de Ruta
        </Text>

        {loading && (
          <Text className="text-3xl font-bold text-gray-700 text-center">
            Cargando datos de la ruta...
          </Text>
        )}

        {error && (
          <Text className="text-3xl font-bold text-red-600 text-center">
            {error}
          </Text>
        )}

        {!loading && !error && (
          <View className="w-full">
            <View className="my-6 p-6 border-4 border-gray-700 rounded-2xl bg-gray-50">
              <Text className="text-4xl font-bold text-gray-900 mb-4">
                Ruta: <Text className="text-blue-800">{routeName}</Text>
              </Text>
              <Text className="text-3xl text-gray-800 mb-4">
                Desde: <Text className="text-green-800">{currentStationName}</Text>
              </Text>
              <Text className="text-3xl font-bold text-red-600">
                El bus sale en {timeToDeparture} minutos
              </Text>
            </View>
          </View>
        )}

        {/* Navigation Button */}
        <View className="w-full flex-row justify-center mt-8 mb-12">
          <TouchableOpacity
            className="bg-red-800 py-6 rounded-2xl w-4/5"
            onPress={() => router.replace("/select-bus-route")}
          >
            <Text className="text-white text-center text-3xl font-bold">Volver</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default BusRoute;
