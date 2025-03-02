import React, { useEffect, useState } from 'react'
import * as Location from 'expo-location'
const API_BASE_URL = process.env.EXPO_PUBLIC_ARRIVING_BUSES_API_BASE_URL;

const getNearestStationfromAPI = async (latitude: number, longitude: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stations/nearest_station`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) {
      throw new Error('Failed to send location');
    }

    const data = await response.json();
    console.log('Location sent successfully:', data);
  } catch (error) {
    console.error('Error sending location:', error);
  }
};


const useLocation = () => {
  let firstTime = true;
  const [errorMsg, setErrorMsg] = useState<string | null>('');
  const [longitude, setLongitude] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);

  const getUserLocation = async () => {
    if (firstTime) {
      let {status} = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Se denegó el acceso a la ubicación');
        console.log('ERROR', errorMsg);
        return;
      }
      firstTime = false;
    }

    let {coords} = await Location.getCurrentPositionAsync({});

    if (coords) {
      const {longitude, latitude} = coords;
      setLongitude(longitude);
      setLatitude(latitude);

      getNearestStationfromAPI(latitude, longitude);

      console.log('LATITUDE', latitude);
      console.log('LONGITUDE', longitude);


      let response = await Location.reverseGeocodeAsync({latitude, longitude});
      console.log('USER LOCATION IS', response);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  return {latitude, longitude, errorMsg};
}

export default useLocation;