import React, { useState, useRef } from "react";
import {
  Text,
  View,
  Image,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import icons from "@/constants/icons";
import { useStationData } from "@/hooks/useStationData";
import { fetchStationById, sendAudioToAPI } from "@/services/api";
import { BusRoute, Station } from "@/types/models";
import { globalCurrentStationData } from "@/tasks/locationTasks";
import 'nativewind';

export default function Index() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [detectedRoutes, setDetectedRoutes] = useState<BusRoute[]>([]);
  const [showRouteSelection, setShowRouteSelection] = useState<boolean>(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  
  const { 
    stationName: currentStation, 
    loading: stationLoading, 
    locationAvailable,
    currentStation: stationData
  } = useStationData();

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso al micrófono para grabar audio.');
        return;
      }

      // Prepare recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const newRecording = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = newRecording.recording;
      setRecording(newRecording.recording);
      setIsRecording(true);

      // Automatically stop recording after 5 seconds
      setTimeout(() => {
        if (recordingRef.current) {
          stopRecording();
        }
      }, 5000);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      setIsRecording(false);
      
      // Get recording URI
      const uri = recordingRef.current.getURI();
      if (!uri) {
        throw new Error('No recording URI available');
      }
      
      // Process the audio
      await processAudioRecording(uri);
      
      // Reset recording state
      recordingRef.current = null;
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'No se pudo detener la grabación');
      setIsRecording(false);
    }
  };

  // Function to handle route selection
  const handleRouteSelection = async (route: BusRoute) => {
    try {
      setProcessingAudio(true);
      const destinationStation: Station = await fetchStationById(route.destinationStationId);
      
      // Get the current station coordinates
      const currentCoordinates = stationData?.coordinates || globalCurrentStationData.station?.coordinates;
      
      if (!currentCoordinates) {
        Alert.alert('Error', 'No se pudo determinar la ubicación actual');
        return;
      }
      
      router.push({
        pathname: "/bus-routes/[id]",
        params: {
          id: route.id.toString(),
          routeName: route.name,
          destinationStationLat: destinationStation.coordinates.latitude.toString(),
          destinationStationLng: destinationStation.coordinates.longitude.toString(),
          currentStationName: currentStation || "Unknown",
          currentStationLat: currentCoordinates.latitude.toString(),
          currentStationLng: currentCoordinates.longitude.toString(),
        },
      });
    } catch (err) {
      console.log('Error handling route selection:', err);
      Alert.alert('Error', 'No se pudo cargar la información de la ruta.');
    } finally {
      setProcessingAudio(false);
    }
  };

  // Function to cancel route selection
  const cancelRouteSelection = () => {
    setShowRouteSelection(false);
    setDetectedRoutes([]);
  };

  const processAudioRecording = async (uri: string) => {
    try {
      // Show loading state
      setProcessingAudio(true);
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Recording file not found');
      }
      
      // Send audio to backend for processing
      const routes = await sendAudioToAPI(uri, fileInfo);
      console.log('Routes found:', routes);
      
      // Handle route detection results
      if (routes && routes.length > 0) {
        if (routes.length === 1) {
          // If only one route, navigate directly to route screen
          const route = routes[0];
          const destinationStation = await fetchStationById(route.destinationStationId);

          // Get the current station coordinates
          const currentCoordinates = stationData?.coordinates || globalCurrentStationData.station?.coordinates;
          
          if (!currentCoordinates) {
            Alert.alert('Error', 'No se pudo determinar la ubicación actual');
            return;
          }
          
          // Navigate to route details screen with params
          router.push({
            pathname: "/bus-routes/[id]",
            params: {
              id: route.id.toString(),
              routeName: route.name,
              destinationStationLat: destinationStation.coordinates.latitude.toString(),
              destinationStationLng: destinationStation.coordinates.longitude.toString(),
              currentStationName: currentStation || "Unknown",
              currentStationLat: currentCoordinates.latitude.toString(),
              currentStationLng: currentCoordinates.longitude.toString(),
            },
          });
        } else {
          // If multiple routes, show selection UI
          console.log("Waiting for user selection");
          setDetectedRoutes(routes);
          setShowRouteSelection(true);
        }
      } else {
        Alert.alert('No se encontró la ruta', 'Intente nuevamente pronunciando claramente el número de ruta.');
      }
    } catch (err: any) {
      console.log('Error processing audio:', err);
      Alert.alert('No se encontró la ruta', 'Intente nuevamente pronunciando claramente el número de ruta.');
    } finally {
      setProcessingAudio(false);
    }
  };
  
  const buttons = [
    { label: isRecording ? "Grabando..." : "Ruta por voz", onPress: startRecording, isVoice: true },
    { label: "Seleccionar Ruta", onPress: () => router.push("/select-bus-route") },
    { label: "Orienta Fácil", onPress: () => router.push("/easy-guide") },
  ];

  // Render route selection UI if needed
  if (showRouteSelection) {
    return (
      <SafeAreaView className="bg-white h-full">
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        
        <View className="p-6">
          <Text className="text-3xl font-bold text-center mb-8">
            Seleccione una ruta
          </Text>
          
          <ScrollView className="mb-6">
            {detectedRoutes.map((route) => (
              <TouchableOpacity
                key={route.id}
                onPress={() => handleRouteSelection(route)}
                className="p-6 bg-dark-blue rounded-xl my-3"
              >
                <Text className="text-white text-2xl font-bold text-center">
                  {route.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            onPress={cancelRouteSelection}
            className="p-6 bg-red-600 rounded-xl mt-4"
          >
            <Text className="text-white text-2xl font-bold text-center">
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-white h-full">
      {/* Set status bar to dark content for visibility on white background */}
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <ScrollView contentContainerClassName="justify-center items-center">
        <Image source={icons.orientapp} className="w-5/6" resizeMode="contain" />
        <View className="items-center w-5/6">
          {/* Current Station Info */}
          <View className="w-full bg-gray-100 rounded-xl p-5 mb-8">
            {!locationAvailable ? (
              <Text className="text-red-600 text-2xl text-center font-bold">
                Esperando acceso a ubicación...
              </Text>
            ) : stationLoading || processingAudio ? (
              <View className="items-center">
                <ActivityIndicator size="large" color="#242E47" />
                <Text className="text-gray-600 text-xl text-center mt-2">
                  {processingAudio ? 'Procesando audio...' : 'Buscando estación más cercana...'}
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
              className="p-8 rounded-2xl my-4 w-5/6 bg-dark-blue"
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
