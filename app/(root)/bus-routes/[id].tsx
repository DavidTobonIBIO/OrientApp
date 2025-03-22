import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;
const GOOGLE_MAPS_ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

const BusRoute = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { routeName } = useLocalSearchParams<{ routeName?: string }>();
  const { destinationStationLat } = useLocalSearchParams<{ destinationStationLat?: string }>();
  const { destinationStationLng } = useLocalSearchParams<{ destinationStationLng?: string }>();
  const { currentStationName } = useLocalSearchParams<{ currentStationName?: string }>();
  const { currentStationLat } = useLocalSearchParams<{ currentStationLat?: string }>();
  const { currentStationLng } = useLocalSearchParams<{ currentStationLng?: string }>();

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
    // minutes as a string rounded to the nearest integer
    const diffMinutesString = diffMinutes.toFixed(0);
    setTimeToDeparture(diffMinutesString);
  };

  const extractGoogleRouteData = (data: any) => {
    // Check if data and routes exist
    if (!data || !data.routes || !data.routes.length) {
      throw new Error("No routes found in Google Maps data.");
    }

    for (const route of data.routes) {
      if (!route.legs || !route.legs.length) continue;

      for (const routeLeg of route.legs) {
        if (!routeLeg.steps || !routeLeg.steps.length) continue;

        const routeSteps = routeLeg.steps;
        for (const step of routeSteps) {
          if (step.travelMode === "TRANSIT" && step.transitDetails) {
            const transitDetails = step.transitDetails;
            if (!transitDetails.transitLine || !transitDetails.transitLine.nameShort) continue;

            const transitLineName = transitDetails.transitLine.nameShort;
            console.log("Transit line:", transitLineName);

            if (transitLineName === routeName &&
              transitDetails.localizedValues &&
              transitDetails.localizedValues.departureTime &&
              transitDetails.localizedValues.departureTime.time &&
              transitDetails.localizedValues.departureTime.time.text) {

              const departureTime = transitDetails.localizedValues.departureTime.time.text;
              console.log("Departure time:", departureTime);
              calculateTimeToDeparture(departureTime);
              return;
            }
          }
        }
      }
    }
    throw new Error("Bus route not found in Google Maps data.");
  };

  // Fetch Google Maps route details using the Google Maps API
  const fetchGoogleRouteData = async () => {
    console.log(`Current station: ${currentStationName}`);
    console.log(`Route: ${routeName}`);
    console.log(`Requesting Google Maps route data:\nfrom (${currentStationLat}, ${currentStationLng})\nto (${destinationStationLat}, ${destinationStationLng})`);

    try {
      const response = await fetch(GOOGLE_MAPS_ROUTES_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY!,
          "X-Goog-FieldMask": "routes.legs",
        },
        body: JSON.stringify({
          "origin": { "location": { "latLng": { "latitude": parseFloat(currentStationLat!), "longitude": parseFloat(currentStationLng!) } } },
          "destination": { "location": { "latLng": { "latitude": parseFloat(destinationStationLat!), "longitude": parseFloat(destinationStationLng!) } } },
          "travelMode": "TRANSIT",
          "computeAlternativeRoutes": true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Google route data received:", data);
      return data;
    } catch (error) {
      console.error("Error fetching Google route data:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching Google route data...");
        const data = await fetchGoogleRouteData();
        setGoogleRouteData(data);

        if (data) {
          extractGoogleRouteData(data);
        } else {
          throw new Error("Failed to retrieve route data from Google Maps API.");
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
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
              Desde: {currentStationName}
            </Text>
            <Text className="text-xl mb-2">
              El bus sale en: {timeToDeparture} minutos
            </Text>
          </ScrollView>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text>No hay información disponible.</Text>
          </View>
        )}
      </View>

      <View className="w-full flex-row justify-center my-6 px-4">
          <TouchableOpacity className="bg-red-800 py-4 rounded-2xl w-2/5" onPress={() => router.replace("/select-bus-route")}>
            <Text className="text-white text-center text-2xl font-bold">Volver</Text>
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BusRoute;