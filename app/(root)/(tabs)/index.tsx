import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  Image,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Button,
} from "react-native";
import { Link, Href } from "expo-router";
import { router } from "expo-router";
import icons from "@/constants/icons";

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;

export default function Index() {
  const [recognizedText, setRecognizedText] = useState('');

  const buttons: { label: string; link: Href }[] = [
    { label: "Ruta por Voz", link: "/voice-route" as const },
    { label: "Seleccionar Ruta", link: "/select-bus-route" as const },
    { label: "Orienta Fácil", link: "/easy-guide" as const },
  ];

  useEffect(() => {
    const lowerText = recognizedText.toLowerCase();
    if (lowerText.includes("seleccionar")) {
      router.push("/select-bus-route");
    } else if (lowerText.includes("orienta")) {
      router.push("/easy-guide");
    } else if (lowerText.includes("voz")) {
      router.push("/voice-route");
    }
  }, [recognizedText]);

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView className="w-full" contentContainerClassName="items-center justify-start pb-10">
        <Image source={icons.orientapp} className="w-5/6 mt-10" resizeMode="contain" />
        <View className="items-center w-5/6">
          <Text className="font-bold text-5xl my-14 font-spaceMono text-center">
            Bienvenido a OrientApp!
          </Text>

          {buttons.map((button, index) => (
            <Link href={button.link} asChild key={index}>
              <TouchableOpacity
                className="p-8 rounded-2xl my-4 w-5/6 bg-dark-blue"
              >
                <Text className="text-white text-center text-3xl font-bold">
                  {button.label}
                </Text>
              </TouchableOpacity>
            </Link>
          ))}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}