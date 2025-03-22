import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { Link } from "expo-router";
import { globalLocationData } from "@/tasks/locationTasks";
import { getAllRoutes, TransmilenioRoute } from "@/constants/transmilenioRoutes";

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;

export default function SelectBusRoute() {
  const [stationName, setStationName] = useState<string | null>("Cargando...");
  const [stationLat, setStationLat] = useState<number | null>(null);
  const [stationLng, setStationLng] = useState<number | null>(null);
  const [transmilenioRoutes, setTransmilenioRoutes] = useState<TransmilenioRoute[]>([]);
  // New state to store destination station data for each route
  const [destinationStations, setDestinationStations] = useState<{ [key: number]: any }>({});

  // Fetch nearest station data
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
      setStationName(station.name);
      setStationLat(station.latitude);
      setStationLng(station.longitude);
    } catch (err) {
      setStationName("Estación desconocida");
    }
  };

  // Fetch destination station data given a station ID
  const fetchDestinationStationData = async (id: number) => {
    const requestEndpoint = `${API_BASE_URL}/stations/${id}`;

    const response = await fetch(requestEndpoint);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const station = await response.json();
    return station;
  };

  useEffect(() => {
    // Fetch nearest station on mount
    fetchNearestStationData();

    // Fetch routes and then destination stations
    const fetchRoutesAndDestinations = async () => {
      const routes = await getAllRoutes();
      setTransmilenioRoutes(routes);

      // Assume each route has a property called destinationStationId
      const destinationPromises = routes.map(async (route) => {
        // Replace 'destinationStationId' with the correct property name if different
        const destination = await fetchDestinationStationData(route.destinationStationId);
        return { routeId: route.id, destination };
      });

      // Wait for all destination station data to be fetched
      const destinations = await Promise.all(destinationPromises);

      // Create a mapping from route id to destination station
      const destMap: { [key: number]: any } = {};
      destinations.forEach(({ routeId, destination }) => {
        destMap[routeId] = destination;
      });
      setDestinationStations(destMap);
    };

    fetchRoutesAndDestinations();
  }, []);

  return (
    <SafeAreaView className="bg-white h-full">
      {/* Title Section */}
      <View className="w-full mb-6 py-5 px-5 justify-center items-center mt-10">
        <Text className="text-4xl font-bold">Origen:</Text>
        <Text className="text-3xl text-gray-700">{stationName}</Text>
      </View>
      <View className="flex-1">
        <ScrollView contentContainerClassName="justify-center items-center p-5">
          {/* Route Buttons */}
          <View className="w-full">
            {transmilenioRoutes.map((route) => {
              // Get the destination station data for this route
              const destinationStation = destinationStations[route.id];

              // If destination data is not yet available, show a placeholder
              if (!destinationStation) {
                return (
                  <View key={route.id} className="w-full h-28 rounded-2xl my-4 mx-auto bg-gray-300 justify-center items-center">
                    <Text className="text-center text-white text-3xl font-bold">Cargando ruta...</Text>
                  </View>
                );
              }

              return (
                <Link 
                  key={route.id}
                  href={{
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
                  }}
                  asChild
                >
                  <TouchableOpacity className="w-full h-28 rounded-2xl my-4 mx-auto bg-dark-blue justify-center">
                    <Text className="text-center text-white text-3xl font-bold">
                      {route.name} {destinationStation.name}
                    </Text>
                  </TouchableOpacity>
                </Link>
              );
            })}
          </View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View className="w-full flex-row justify-between mt-8 mb-4 px-4">
          <Link href="/" asChild>
            <TouchableOpacity className="bg-red-800 py-11 rounded-2xl w-2/5 mx-2">
              <Text className="text-white text-center text-3xl font-bold">Volver</Text>
            </TouchableOpacity>
          </Link>

          {/* Example navigation to search route */}
          { /* TODO: implement search route funcitionality */ }
          <Link href={{ pathname: "/(root)/(tabs)" }} asChild>
            <TouchableOpacity className="bg-red-800 py-11 rounded-2xl w-2/5 mx-2">
              <Text className="text-white text-center text-3xl font-bold">Buscar ruta</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
