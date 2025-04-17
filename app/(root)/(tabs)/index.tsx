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
  StatusBar,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import icons from "@/constants/icons";
import { globalLocationData, globalCurrentStationData, addStationDataListener } from "@/tasks/locationTasks";
import 'nativewind';
import { BusRoute, Station, fetchStationById } from "@/context/AppContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;

export default function Index() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentStation, setCurrentStation] = useState<string | null>(null);
  const [locationAvailable, setLocationAvailable] = useState<boolean>(false);
  const [stationLoading, setStationLoading] = useState<boolean>(true);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [detectedRoutes, setDetectedRoutes] = useState<BusRoute[]>([]);
  const [showRouteSelection, setShowRouteSelection] = useState<boolean>(false);

  // Update component state with global station data
  const updateFromGlobalData = () => {
    try {
      const { station } = globalCurrentStationData;
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
      
      // Send audio to API
      await sendAudioToAPI(uri);
      
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
      setStationLoading(true);
      const destinationStation: Station = await fetchStationById(route.destinationStationId);
      
      router.push({
        pathname: "/bus-routes/[id]",
        params: {
          id: route.id,
          routeName: route.name,
          destinationStationLat: destinationStation.coordinates.latitude,
          destinationStationLng: destinationStation.coordinates.longitude,
          currentStationName: globalCurrentStationData.station?.name,
          currentStationLat: globalCurrentStationData.station?.coordinates.latitude,
          currentStationLng: globalCurrentStationData.station?.coordinates.longitude,
        },
      });
    } catch (err) {
      console.error('Error handling route selection:', err);
      Alert.alert('Error', 'No se pudo cargar la información de la ruta.');
    } finally {
      setStationLoading(false);
    }
  };

  // Function to cancel route selection
  const cancelRouteSelection = () => {
    setShowRouteSelection(false);
    setDetectedRoutes([]);
  };

  const sendAudioToAPI = async (uri: string) => {
    try {
      // Show loading state
      setStationLoading(true);
      
      // Check file extension and type
      const fileExtension = uri.split('.').pop()?.toLowerCase();
      const mimeType = fileExtension === 'm4a' ? 'audio/m4a' : 'audio/wav';
      const fileName = `recording.${fileExtension}`;
      
      console.log('File type:', mimeType, 'File name:', fileName);
      
      // Read the file as base64
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Recording file not found');
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('audio', {
        uri: uri,
        name: fileName,
        type: mimeType,
      } as any);
      
      // Make API request
      console.log('Sending request to API...');
      const response = await fetch(`${API_BASE_URL}/voice/route`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      }).catch(e => {
        console.log('Fetch error:', e);
        throw new Error('Error de conexión: ' + e.message);
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('API error response:', errorText);
        throw new Error(`Error en la solicitud: ${response.status}`);
      }
      
      const routes: BusRoute[] = await response.json();
      console.log('Routes found:', routes);
      
      // If routes were found, navigate to route details or show confirmation
      if (routes) {
        if (routes.length === 1) {
          // If only one route, navigate directly to route screen
          const route = routes[0];
          
          const destinationStation: Station = await fetchStationById(route.destinationStationId);

          // Navigate to route details screen with params
          router.push({
            pathname: "/bus-routes/[id]",
            params: {
              id: route.id,
              routeName: route.name,
              destinationStationLat: destinationStation.coordinates.latitude,
              destinationStationLng: destinationStation.coordinates.longitude,
              currentStationName: globalCurrentStationData.station?.name,
              currentStationLat: globalCurrentStationData.station?.coordinates.latitude,
              currentStationLng: globalCurrentStationData.station?.coordinates.longitude,
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
      console.log('Error sending audio to API:', err);
      Alert.alert('No se encontró la ruta', 'Intente nuevamente pronunciando claramente el número de ruta.');
    } finally {
      setStationLoading(false);
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
          {/* 
          <Text className="font-bold text-5xl font-spaceMono text-center mb-8 mt-2">
            Bienvenido a OrientApp!
          </Text>
          */}

          {/* Current Station Info */}
          <View className="w-full bg-gray-100 rounded-xl p-5 mb-8">
            {!locationAvailable ? (
              <Text className="text-red-600 text-2xl text-center font-bold">
                Esperando acceso a ubicación...
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
