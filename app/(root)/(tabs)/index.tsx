import React, { useEffect, useState } from "react";
import { Text, View, Image, ScrollView, SafeAreaView, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import KeyEvent from "react-native-keyevent";
import icons from "@/constants/icons";

interface KeyEventType {
  keyCode: number;
}

export default function Index() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const buttons = [
    { label: "Seleccionar Ruta", link: "/select-bus-route" },
    { label: "Orienta Fácil", link: "/easy-guide" },
    { label: "Guía de Usuario", link: "/user-guide" },
  ];

  useEffect(() => {
    const handleKeyDown = (keyEvent: KeyEventType) => {
      if (keyEvent.keyCode === 25) {
        // Volume Down - Move to the next button
        setSelectedIndex((prevIndex) => (prevIndex + 1) % buttons.length);
      } else if (keyEvent.keyCode === 24) {
        // Volume Up - Move to the previous button
        setSelectedIndex((prevIndex) => (prevIndex - 1 + buttons.length) % buttons.length);
      } else if (keyEvent.keyCode === 66) {
        // Enter Key - Select the current button
        router.push(buttons[selectedIndex].link);
      }
    };

    KeyEvent.onKeyDownListener(handleKeyDown);

    return () => {
      KeyEvent.removeKeyDownListener();
    };
  }, [selectedIndex]);

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
                className={`p-8 rounded-2xl my-4 w-5/6 ${
                  selectedIndex === index ? "bg-blue-700" : "bg-dark-blue"
                }`}
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
