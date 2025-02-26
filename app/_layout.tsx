import { SplashScreen, Stack } from "expo-router";
import "./global.css";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { LocationProvider } from "@/context/LocationContext";

export default function RootLayout() {

  const [fontsLoaded] = useFonts({
    "SpaceMono-regular": require('../assets/fonts/SpaceMono-Regular.ttf')
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync(); 
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  return (
    <LocationProvider>
      <Stack screenOptions={{ headerShown: false}}/>
    </LocationProvider>
  );
}
