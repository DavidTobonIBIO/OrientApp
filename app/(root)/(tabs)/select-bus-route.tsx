import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { globalLocationData } from "@/tasks/locationTasks";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BusRoute, Station } from "@/types/models";
import { fetchStationById } from "@/services/api";

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;

export default function SelectBusRoute() {
  const { voiceRoute } = useLocalSearchParams();
  const router = useRouter();
  const [stationName, setStationName] = useState<string | null>("Cargando...");
  const [stationLat, setStationLat] = useState<number | null>(null);
  const [stationLng, setStationLng] = useState<number | null>(null);
  const [transmilenioRoutes, setTransmilenioRoutes] = useState<BusRoute[]>([]);
  const [destinationStations, setDestinationStations] = useState<{
    [key: string]: Station;
  }>({});

  const fetchNearestStationData = async () => {
    try {
      const requestEndpoint = `${API_BASE_URL}/stations/nearest_station`;
      const { latitude, longitude } = globalLocationData;

      const response = await fetch(requestEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const station: Station = await response.json();
      console.log("Nearest Station:", station);

      setStationName(station.name);
      setStationLat(station.coordinates.latitude);
      setStationLng(station.coordinates.longitude);
      setTransmilenioRoutes(station.arrivingRoutes || []);
    } catch (err) {
      console.error("Failed to fetch nearest station:", err);
      setStationName("Estación desconocida");
    }
  };

  useEffect(() => {
    fetchNearestStationData();
  }, []);

  useEffect(() => {
    if (transmilenioRoutes.length === 0) return;

    const fetchDestinations = async () => {
      const destinationPromises = transmilenioRoutes
        .filter((route) => route.destinationStationId !== null)
        .map(async (route) => {
          try {
            const destination = await fetchStationById(route.destinationStationId);
            return { routeId: `${route.id}-${route.name}`, destination };
          } catch (err) {
            console.warn(`❗ Error fetching destination for route ${route.name}:`, err);
            return null;
          }
        });

      const destinations = (await Promise.all(destinationPromises)).filter(
        (d): d is { routeId: string; destination: Station } => d !== null
      );

      const destMap: { [key: string]: Station } = {};
      destinations.forEach(({ routeId, destination }) => {
        destMap[routeId] = destination;
      });

      // console.log("Destination station map:", destMap);
      setDestinationStations(destMap);

      if (voiceRoute && typeof voiceRoute === "string") {
        const matchedRoute = transmilenioRoutes.find(
          (r) => r.name.trim().toLowerCase() === voiceRoute.trim().toLowerCase()
        );
      
        if (matchedRoute) {
          const key = `${matchedRoute.id}-${matchedRoute.name}`;
          const destinationStation = destMap[key];

          console.log("Voice route param:", voiceRoute);
          console.log("Available route names:", transmilenioRoutes.map(r => r.name));

      
          if (destinationStation) {
            handleNavigation(matchedRoute, destinationStation);
          }
        }
      }
    };

    fetchDestinations();
  }, [transmilenioRoutes]);

  const handleNavigation = (route: BusRoute, destinationStation: Station) => {
    router.push({
      pathname: "/bus-routes/[id]",
      params: {
        id: route.id.toString(),
        routeName: route.name,
        destinationStationLat: destinationStation.coordinates.latitude.toString(),
        destinationStationLng: destinationStation.coordinates.longitude.toString(),
        currentStationName: stationName,
        currentStationLat: stationLat?.toString() || "0",
        currentStationLng: stationLng?.toString() || "0",
      },
    });
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <View className="w-full mb-6 py-5 px-5 justify-center items-center mt-10">
        <Text className="text-4xl font-bold">Origen:</Text>
        <Text className="text-3xl text-gray-700">{stationName}</Text>
      </View>

      <View className="flex-1">
        <ScrollView contentContainerClassName="justify-center items-center p-5">
          <View className="w-full">
            {transmilenioRoutes.length === 0 ? (
              <Text className="text-3xl font-bold text-red-600 text-center mt-6">
                No hay rutas que pasen por esta estación.
              </Text>
            ) : (
              transmilenioRoutes.map((route) => {
                const key = `${route.id}-${route.name}`;
                const destinationStation = destinationStations[key];

                if (
                  !destinationStation ||
                  destinationStation.name.trim().toLowerCase() === stationName?.trim().toLowerCase()
                ) {
                  return null;
                }
                
                return (
                  <TouchableOpacity
                    key={key}
                    className="w-full min-h-32 rounded-2xl my-4 mx-auto bg-dark-blue justify-center px-4 py-5"
                    onPress={() => handleNavigation(route, destinationStation)}
                  >
                    <Text
                      className="text-white text-3xl font-bold text-center"
                      numberOfLines={2}
                      adjustsFontSizeToFit
                    >
                      {route.name} hacia {destinationStation.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        <View className="w-full flex-row justify-between mt-8 mb-4 px-4">
          <TouchableOpacity className="bg-red-800 py-11 rounded-2xl w-2/5 mx-2">
            <Text
              className="text-white text-center text-3xl font-bold"
              onPress={() => router.replace("/")}
            >
              Buscar ruta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-red-800 py-11 rounded-2xl w-2/5 mx-2">
            <Text
              className="text-white text-center text-3xl font-bold"
              onPress={() => router.replace("/")}
            >
              Volver
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
