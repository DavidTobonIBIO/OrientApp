import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;
const GOOGLE_MAPS_ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

const BusRoute = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { routeName } = useLocalSearchParams<{ routeName?: string }>();
  const { routeDestination } = useLocalSearchParams<{ routeDestination?: string }>();
  const { currentStation } = useLocalSearchParams<{ currentStation?: string }>();

  const [googleRouteData, setGoogleRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timeToDeparture, setTimeToDeparture] = useState<string | null>(null);

  const calculateTimeToDeparture = (departureTime: string) => {
    const now = new Date();

    // Parse departure time ("HH:MM")
    const [departureHours, departureMinutes] = departureTime.split(':').map(Number);

    // Create Date object for departure time today
    const departureDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      departureHours,
      departureMinutes
    );

    // Calculate difference in milliseconds and convert to minutes
    const diffMs = departureDate.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    // minutes as a string rounded to two decimals
    setTimeToDeparture(diffMinutes.toFixed(2));
    console.log("Time to departure:", timeToDeparture);
  };


  const extractGoogleRouteData = () => {
    if (!googleRouteData) {
      console.log(error);
      return;
    }

    // Extract the first route from the Google Maps API response
    for (const route of googleRouteData.routes) {
      const routeLeg = route.legs[0];
      const routeSteps = routeLeg.steps;

      for (const step of routeSteps) {
        if (step.travelMode === "TRANSIT") {
          const transitDetails = step.transitDetails;
          const transitLineName = transitDetails.transitLine.nameShort;
          if (transitLineName === routeName) {
            console.log("Route found:", transitDetails);
            const departureTime = transitDetails.localizedValues.departureTime;
            calculateTimeToDeparture(departureTime);
            break;
          }
        }
      }
    }
  };

  // Fetch Google Maps route details using the Google Maps API
  const fetchGoogleRouteData = async (originStation: string, destinationStation: string) => {
    try {
      const originAddress = `Transmilenio - Estación ${originStation}, Bogotá`;
      const destinationAddress = `Transmilenio - Estación ${destinationStation}, Bogotá`;
      const response = await fetch(GOOGLE_MAPS_ROUTES_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY!,
          "X-Goog-FieldMask": "routes.legs",
        },
        body: JSON.stringify({
          origin: { address: originAddress },
          destination: { address: destinationAddress },
          travelMode: "TRANSIT",
          computeAlternativeRoutes: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      setGoogleRouteData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error fetching Google route data.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (routeDestination && currentStation) {
        await fetchGoogleRouteData(currentStation, routeDestination);
      } else {
        setError("Missing route or station data.");
      }

      extractGoogleRouteData();

      setLoading(false);
    };

    fetchData();
  }, [id]);

  return (
    <SafeAreaView className="bg-white h-full">
      <View className="flex-1 p-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <Text>Cargando información de la ruta...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-red-500">{error}</Text>
          </View>
        ) : googleRouteData ? (
          <ScrollView className="flex-1 py-6">
            <Text className="text-2xl font-bold mb-4">
              Ruta: {routeName}
            </Text>
            <Text className="text-xl mb-2">
              Desde: {currentStation}
            </Text>
            <Text className="text-xl mb-4">
              Hasta: {routeDestination}
            </Text>
          </ScrollView>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text>No hay información disponible.</Text>
          </View>
        )}
      </View>

      <View className="w-full flex-row justify-center my-6 px-4">
        <Link href="/select-bus-route" asChild>
          <TouchableOpacity className="bg-red-800 py-4 rounded-2xl w-2/5">
            <Text className="text-white text-center text-2xl font-bold">Volver</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
};

export default BusRoute;
