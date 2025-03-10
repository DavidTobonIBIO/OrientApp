import React, { useEffect, useState } from "react";
import { Text, View, Image, ScrollView, SafeAreaView, TouchableOpacity, Platform } from "react-native";
import { Link, useRouter, Href } from "expo-router";
import KeyEvent from "react-native-keyevent";
import icons from "@/constants/icons";

export default function Index() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const buttons: { label: string; link: Href }[] = [
    { label: "Seleccionar Ruta", link: "/select-bus-route" as const },
    { label: "Orienta Fácil", link: "/easy-guide" as const },
    { label: "Guía de Usuario", link: "/user-guide" as const },
  ];

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (Platform.OS === "android") {
        if (event.keyCode === 25 || event.key === "ArrowDown") {
          console.log("✅ Volume Up Pressed");
          setSelectedIndex((prevIndex) => (prevIndex + 1) % buttons.length);
        } else if (event.keyCode === 24 || event.key === "ArrowUp") {
          console.log("✅ Volume Up Pressed");
          setSelectedIndex((prevIndex) => (prevIndex - 1 + buttons.length) % buttons.length);
        } else if (event.keyCode === 66 || event.key === "Enter") {
          console.log("✅ Enter Key Pressed");
          router.push(buttons[selectedIndex].link);
        }
      }
    };

    if (Platform.OS === "android") {
      KeyEvent.onKeyDownListener(handleKeyDown);
    } else {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      if (Platform.OS === "android") {
        KeyEvent.removeKeyDownListener();
      } else {
        document.removeEventListener("keydown", handleKeyDown);
      }
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
