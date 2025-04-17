import React, { useState, useRef } from "react";
import {
  Text,
  View,
  Image,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import icons from "@/constants/icons";
import { globalLocationData } from "@/tasks/locationTasks";

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;

export default function Index() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

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
        <View className="items-center w-5/6 mt-8">
          <Text className="font-bold text-5xl my-14 font-spaceMono text-center">
            Bienvenido a OrientApp!
          </Text>

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
