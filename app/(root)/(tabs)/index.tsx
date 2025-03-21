import React from "react";
import { Text, View, Image, ScrollView, SafeAreaView, TouchableOpacity, Platform } from "react-native";
import { Link, Href } from "expo-router";
import icons from "@/constants/icons";
const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;


export default function Index() {

  const buttons: { label: string; link: Href }[] = [
    { label: "Seleccionar Ruta", link: "/select-bus-route" as const },
    { label: "Orienta Fácil", link: "/easy-guide" as const },
    { label: "Guía de Usuario", link: "/user-guide" as const },
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
