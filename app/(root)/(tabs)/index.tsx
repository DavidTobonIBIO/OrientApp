import React, { useState, useRef, useEffect } from "react";
import {
  Text,
  View,
  Image,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import icons from "@/constants/icons";
import { globalLocationData, globalStationData, addStationDataListener } from "@/tasks/locationTasks";
import 'nativewind';

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;

export default function Index() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentStation, setCurrentStation] = useState<string | null>(null);
  const [locationAvailable, setLocationAvailable] = useState<boolean>(false);
  const [stationLoading, setStationLoading] = useState<boolean>(true);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Update component state with global station data
  const updateFromGlobalData = () => {
    try {
      const { station } = globalStationData;
      const { latitude, longitude } = globalLocationData;
      
      // Check if location data is available
      setLocationAvailable(latitude !== 0 || longitude !== 0);
      
      if (station) {
        setCurrentStation(station.name);
        setStationLoading(false);
      } else {
        setCurrentStation(null);
        setStationLoading(locationAvailable);
      }
    } catch (err) {
      console.error('Error updating station data:', err);
      setCurrentStation(null);
      setStationLoading(false);
    }
  };

  // Subscribe to global station data updates
  useEffect(() => {
    // Initial update from global data
    updateFromGlobalData();
    
    // Register listener for updates
    const removeListener = addStationDataListener(updateFromGlobalData);
    
    // Cleanup listener on unmount
    return () => {
      removeListener();
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log("Requesting permissions...");
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording...");
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      recordingRef.current = newRecording;
      setRecording(newRecording);
      setIsRecording(true);

      setTimeout(() => stopRecording(), 4000);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = async () => {
    const rec = recordingRef.current;
    if (!rec) return;

    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      console.log("Recording stopped and stored at", uri);
      recordingRef.current = null;
      setRecording(null);
      setIsRecording(false);

      if (uri) {
        await sendAudioToAPI(uri);
      }
    } catch (err) {
      console.error("Failed to stop recording:", err);
    }
  };

  const sendAudioToAPI = async (uri: string) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileUri = fileInfo.uri;
  
      const formData = new FormData();
      formData.append("audio", {
        uri: fileUri,
        name: "voice-input.wav",
        type: "audio/wav",
      } as any);
  
      const response = await fetch(`${API_BASE_URL}/voice/route`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
  
      const data = await response.json();
      console.log("API Response:", data);
  
      if (response.ok && data.routeId && data.routeName) {
        const nearestResponse = await fetch(`${API_BASE_URL}/stations/nearest_station`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(globalLocationData),
        });
  
        const nearestStation = await nearestResponse.json();
        console.log("Nearest Station:", nearestStation);
  
        const matchingRoute = nearestStation.arrivingRoutes.find(
          (r: any) => r.name.toUpperCase() === data.routeName.toUpperCase()
        );
  
        if (!matchingRoute) {
          Alert.alert("Ruta no encontrada", "Esa ruta no pasa por tu estación más cercana.");
          return;
        }
  
        const destinationResponse = await fetch(`${API_BASE_URL}/stations/${matchingRoute.destinationStationId}`);
        const destination = await destinationResponse.json();
  
        router.push({
          pathname: "/bus-routes/[id]",
          params: {
            id: String(matchingRoute.id),
            routeName: matchingRoute.name,
            destinationStationLat: destination.latitude,
            destinationStationLng: destination.longitude,
            currentStationName: nearestStation.name,
            currentStationLat: nearestStation.latitude,
            currentStationLng: nearestStation.longitude,
          },
        });
      } else {
        Alert.alert("Ruta no encontrada", "Intenta de nuevo por favor.");
      }
    } catch (error) {
      console.error("Error sending audio to API:", error);
      Alert.alert("Error al procesar la grabación. Intenta nuevamente.");
    }
  };
  
  const buttons = [
    { label: isRecording ? "Grabando..." : "Ruta por voz", onPress: startRecording, isVoice: true },
    { label: "Seleccionar Ruta", onPress: () => router.push("/select-bus-route") },
    { label: "Orienta Fácil", onPress: () => router.push("/easy-guide") },
  ];

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerClassName="justify-center items-center py-10">
        <Image source={icons.orientapp} className="w-5/6" resizeMode="contain" />
        <View className="items-center w-5/6">
          <Text className="font-bold text-5xl font-spaceMono text-center mb-8 mt-2">
            Bienvenido a OrientApp!
          </Text>

          {/* Current Station Info */}
          <View className="w-full bg-gray-100 rounded-xl p-5 mb-8">
            {!locationAvailable ? (
              <Text className="text-red-600 text-xl text-center font-bold">
                Servicio de ubicación no disponibles
              </Text>
            ) : stationLoading ? (
              <View className="items-center">
                <ActivityIndicator size="large" color="#242E47" />
                <Text className="text-gray-600 text-xl text-center mt-2">
                  Buscando estación más cercana...
                </Text>
              </View>
            ) : currentStation ? (
              <View>
                <Text className="text-gray-700 text-xl text-center">
                  Estación más cercana:
                </Text>
                <Text className="text-dark-blue text-4xl font-bold text-center mt-1">
                  {currentStation}
                </Text>
              </View>
            ) : (
              <Text className="text-orange-600 text-xl text-center">
                No se encontró ninguna estación cercana
              </Text>
            )}
          </View>

          {buttons.map((button, index) => (
            <TouchableOpacity
              key={index}
              onPress={button.onPress}
              className={`p-8 rounded-2xl my-4 w-5/6 ${button.isVoice ? "bg-dark-blue" : "bg-dark-blue"}`}
            >
              <Text className="text-white text-center text-3xl font-bold">
                {button.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
