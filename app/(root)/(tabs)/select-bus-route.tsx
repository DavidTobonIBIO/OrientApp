import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { globalLocationData } from "@/tasks/locationTasks";
import { TransmilenioRoute, TransmilenioStation } from "@/constants/transmilenioRoutes";

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;

export default function SelectBusRoute() {
  const [stationName, setStationName] = useState<string | null>("Cargando...");
  const [stationLat, setStationLat] = useState<number | null>(null);
  const [stationLng, setStationLng] = useState<number | null>(null);
  const [transmilenioRoutes, setTransmilenioRoutes] = useState<TransmilenioRoute[]>([]);
  const [destinationStations, setDestinationStations] = useState<{
    [key: string]: TransmilenioStation;
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

      const station = await response.json();
      console.log("Nearest Station:", station);

      setStationName(station.name);
      setStationLat(station.latitude);
      setStationLng(station.longitude);
      setTransmilenioRoutes(station.arrivingRoutes || []);
    } catch (err) {
      console.error("Failed to fetch nearest station:", err);
      setStationName("Estación desconocida");
    }
  };

  const fetchDestinationStationData = async (id: number) => {
    const requestEndpoint = `${API_BASE_URL}/stations/${id}`;
    const response = await fetch(requestEndpoint);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
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
            const destination = await fetchDestinationStationData(route.destinationStationId);
            return { routeId: `${route.id}-${route.name}`, destination };
          } catch (err) {
            console.warn(`❗ Error fetching destination for route ${route.name}:`, err);
            return null;
          }
        });

      const destinations = (await Promise.all(destinationPromises)).filter(
        (d): d is { routeId: string; destination: TransmilenioStation } => d !== null
      );

      const destMap: { [key: string]: TransmilenioStation } = {};
      destinations.forEach(({ routeId, destination }) => {
        destMap[routeId] = destination;
      });

      console.log("Destination station map:", destMap);
      setDestinationStations(destMap);
    };

    fetchDestinations();
  }, [transmilenioRoutes]);

  const handleNavigation = (route: TransmilenioRoute, destinationStation: TransmilenioStation) => {
    router.push({
      pathname: "/bus-routes/[id]",
      params: {
        id: route.id,
        routeName: route.name,
        destinationStationLat: destinationStation.latitude,
        destinationStationLng: destinationStation.longitude,
        currentStationName: stationName,
        currentStationLat: stationLat,
        currentStationLng: stationLng,
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

                if (!destinationStation) return null;

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
              Volver
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-red-800 py-11 rounded-2xl w-2/5 mx-2">
            <Text
              className="text-white text-center text-3xl font-bold"
              onPress={() => router.replace("/")}
            >
              Buscar ruta
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
