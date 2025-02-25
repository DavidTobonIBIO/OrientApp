import { useState, useEffect } from "react";
import * as Location from "expo-location";

export default function useLocationTracker() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [watcher, setWatcher] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  // Request permissions for location tracking
  const requestPermissions = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    let { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    
    if (status !== "granted" || bgStatus !== "granted") {
      setErrorMsg("Se denegó el acceso a la ubicación");
      console.error("ERROR:", errorMsg);
      return false;
    }

    return true;
  };

  // Start location tracking
  const startTracking = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const watcherInstance = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Updates every second
        distanceInterval: 5, // Updates when moving 5 meters
      },
      (position) => {
        if (!position.coords) return;
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        console.log("LATITUDE", latitude);
        console.log("LONGITUDE", longitude);
        console.log("");
      }
    );
    setWatcher(watcherInstance);
  };

  // Stop location tracking
  const stopTracking = () => {
    if (watcher) {
      watcher.remove();
      setWatcher(null);
    }
  };

  return { latitude, longitude, errorMsg, startTracking, stopTracking };
}
