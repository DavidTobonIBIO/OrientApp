import React, { useEffect, useState } from 'react'
import * as Location from 'expo-location'

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