import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

const BusRoute = () => {
  const {
    id, routeName, destinationStationLat, destinationStationLng,
    currentStationName, currentStationLat, currentStationLng
  } = useLocalSearchParams<{
    id?: string; routeName?: string; destinationStationLat?: string; destinationStationLng?: string;
    currentStationName?: string; currentStationLat?: string; currentStationLng?: string;
  }>();

  const [googleRouteData, setGoogleRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeToDeparture, setTimeToDeparture] = useState<string | null>(null);

  const calculateTimeToDeparture = (departureTime: string) => {
    const now = new Date();
    const [hours, minutes] = departureTime.split(':').map(Number);
    const departure = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    const diffMinutes = (departure.getTime() - now.getTime()) / (1000 * 60);
    setTimeToDeparture(diffMinutes.toFixed(0));
  };

  const extractGoogleRouteData = (data: any) => {
    for (const route of data.routes || []) {
      for (const leg of route.legs || []) {
        for (const step of leg.steps || []) {
          if (
            step.travelMode === "TRANSIT" &&
            step.transitDetails?.transitLine?.nameShort === routeName
          ) {
            const departureTime = step.transitDetails?.localizedValues?.departureTime?.time?.text;
            if (departureTime) {
              calculateTimeToDeparture(departureTime);
              return;
            }
          }
        }
      }
    }
    throw new Error(`Informacion de la ruta ${routeName} (con id ${id}) para la estacion ${currentStationName} no encontrada en los datos de Google Maps.`);
  };

  const fetchGoogleRouteData = async () => {
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
              latitude: parseFloat(currentStationLat!),
              longitude: parseFloat(currentStationLng!)
            }
          }
        },
        destination: {
          location: {
            latLng: {
              latitude: parseFloat(destinationStationLat!),
              longitude: parseFloat(destinationStationLng!)
            }
          }
        },
        travelMode: "TRANSIT",
        computeAlternativeRoutes: true
      })
    });

    if (!response.ok) throw new Error(`Google API error: ${response.status}`);
    return response.json();
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGoogleRouteData();
        setGoogleRouteData(data);
        extractGoogleRouteData(data);
      } catch (e: any) {
        setError(e.message || "Ocurrió un error inesperado.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
