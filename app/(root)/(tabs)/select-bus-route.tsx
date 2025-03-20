import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { Link } from "expo-router";
import { globalLocationData } from "@/tasks/locationTasks";
import { getAllRoutes, Route } from "@/constants/transmilenioRoutes";

const API_BASE_URL = process.env.EXPO_PUBLIC_ARRIVING_BUSES_API_BASE_URL;

export default function SelectBusRoute() {
  const [stationName, setStationName] = useState<string | null>("Cargando...");
  const [transmilenioRoutes, setTransmilenioRoutes] = useState<Route[]>([]);

  // Fetch nearest station name
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
    } catch (err) {
      setStationName("Estación desconocida");
    }
  };

  useEffect(() => {
    fetchNearestStationData(); // Fetch on mount

    // Fetch routes
    const fetchRoutes = async () => {
      const routes = await getAllRoutes();
      setTransmilenioRoutes(routes);
    };

    fetchRoutes();
  }, []);

  return (
    <SafeAreaView className="bg-white h-full">
      {/* Title Section */}
      <View className="w-full mb-6 py-5 px-5 justify-center items-center mt-10">
        <Text className="text-4xl font-bold">Origen:</Text>
        <Text className="text-3xl italic text-gray-700">{stationName}</Text>
      </View>
      <View className="flex-1">
        <ScrollView contentContainerClassName="justify-center items-center p-5">
          {/* Large Route Buttons */}
          {/* Dynamically generated route buttons */}
          <View className="w-full">
            {transmilenioRoutes.map((route) => (
              <TouchableOpacity
                className="w-5/6 py-6 rounded-2xl my-4 mx-auto bg-dark-blue" key={`${route.name} ${route.destination}`}
              >
                <Text className="text-center text-white text-3xl font-bold">{route.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Larger Navigation Buttons */}
        <View className="w-full flex-row justify-between mt-8 mb-4 px-4">
          <Link href="/" asChild>
            <TouchableOpacity className="bg-red-800 py-11 rounded-2xl w-2/5 mx-2">
              <Text className="text-white text-center text-3xl font-bold">Volver</Text>
            </TouchableOpacity>
          </Link>

          {/* TODO: buscar ruta */}
          <Link href={{pathname: "/(root)/(tabs)"}} asChild>
            <TouchableOpacity className="bg-red-800 py-11 rounded-2xl w-2/5 mx-2">
              <Text className="text-white text-center text-3xl font-bold">Buscar ruta</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
