import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;

export default function VoiceRoute() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startRecording = async () => {
    try {
      console.log("Requesting permissions..");
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Se necesita acceso al micrófono.");
        return;
      }

      console.log("Starting recording...");
      setIsRecording(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setTimeout(async () => {
        await stopRecording(recording);
      }, 4000); // 4 seconds max
    } catch (err) {
      console.error("Failed to start recording", err);
      setIsRecording(false);
    }
  };

  const stopRecording = async (recording: Audio.Recording) => {
    try {
      console.log("Stopping recording...");
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log("Recording saved to", uri);

      if (uri) {
        await sendAudioToAPI(uri);
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const sendAudioToAPI = async (uri: string) => {
    try {
      setIsLoading(true);
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

      const result = await response.json();
      console.log("API Response:", result);
      setIsLoading(false);

      if (result.route) {
        Alert.alert("Ruta detectada", result.route);
        // Optionally navigate to select-bus-route screen or show results directly
        router.push("/select-bus-route");
      } else {
        Alert.alert("Error", "No se pudo detectar la ruta");
      }
    } catch (err) {
      console.error("Error sending audio:", err);
      Alert.alert("Error", "No se pudo enviar el audio.");
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="bg-white h-full justify-center items-center p-6">
      <Text className="text-4xl font-bold text-center mb-10">Habla tu ruta</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity
          className="bg-dark-blue p-10 rounded-2xl"
          onPress={startRecording}
          disabled={isRecording}
        >
          <Text className="text-white text-3xl font-bold text-center">
            {isRecording ? "Grabando..." : "Presiona y habla"}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
