import React from 'react'
import * as Location from 'expo-location'

const useLocation = () => {
  const [errorMsg, setErrorMsg] = React.useState<string | null>('');
  const [longitude, setLongitude] = React.useState<number | null>(null);
  const [latitude, setLatitude] = React.useState<number | null>(null);

  const getUserLocation = async () => {
    let {status} = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      console.log('ERROR', errorMsg);
      return;
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

  React.useEffect(() => {
    getUserLocation();
  }, []);

  return {latitude, longitude, errorMsg};
}

export default useLocation;