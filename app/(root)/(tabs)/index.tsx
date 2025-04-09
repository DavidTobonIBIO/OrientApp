import React, { useState } from "react";
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
import { router } from "expo-router";
import { Href } from "expo-router";
import icons from "@/constants/icons";

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;

type ButtonItem = {
  label: string;
  link: Href;
  isVoice?: boolean;
};

export default function Index() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingLabel, setRecordingLabel] = useState("Ruta por Voz");
  const [isLoading, setIsLoading] = useState(false);

  const startRecording = async () => {
    try {
      setRecordingLabel("Grabando...");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);

      // Auto-stop after 5 seconds
      setTimeout(() => {
        stopRecordingAndSend(recording);
      }, 5000);
    } catch (err) {
      console.error("Error starting recording:", err);
      Alert.alert("Error", "No se pudo iniciar la grabación.");
      setRecordingLabel("Ruta por Voz");
    }
  };

  const stopRecordingAndSend = async (recordingInstance: Audio.Recording) => {
    try {
      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();
      setRecording(null);
      if (uri) {
        setRecordingLabel("Procesando...");
        await sendAudioToAPI(uri);
      }
    } catch (err) {
      console.error("Error stopping recording:", err);
      Alert.alert("Error", "No se pudo detener la grabación.");
      setRecordingLabel("Ruta por Voz");
    }
  };

  const sendAudioToAPI = async (uri: string) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("audio", {
        uri,
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

      if (response.ok && data.route) {
        setRecordingLabel("Ruta por Voz");
        router.push({
          pathname: "/select-bus-route",
          params: { voiceRoute: data.route },
        });
      } else {
        Alert.alert("Error", "No se pudo reconocer la ruta. Intenta de nuevo.");
        setRecordingLabel("Ruta por Voz");
      }
    } catch (error) {
      console.error("Error sending audio:", error);
      Alert.alert("Error", "Hubo un problema al enviar el audio.");
      setRecordingLabel("Ruta por Voz");
    } finally {
      setIsLoading(false);
    }
  };

  const buttons: ButtonItem[] = [
    { label: recordingLabel, link: "/select-bus-route" as const, isVoice: true },
    { label: "Seleccionar Ruta", link: "/select-bus-route" as const },
    { label: "Orienta Fácil", link: "/easy-guide" as const },
  ];
  
  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerClassName="h-full justify-center items-center">
        <Image source={icons.orientapp} className="w-5/6" resizeMode="contain" />
        <View className="items-center w-5/6">
          <Text className="font-bold text-5xl my-14 font-spaceMono text-center">
            Bienvenido a OrientApp!
          </Text>

          {buttons.map((button, index) => (
            <TouchableOpacity
              key={index}
              className="p-8 rounded-2xl my-4 w-5/6 bg-dark-blue"
              onPress={() => {
                if (button.isVoice) startRecording();
                else if (button.link) router.push(button.link);
              }}
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
