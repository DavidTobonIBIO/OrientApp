import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { globalLocationData } from '@/tasks/locationTasks';

const API_BASE_URL = process.env.EXPO_PUBLIC_ARRIVING_BUSES_API_BASE_URL;

const EasyGuide = () => {
  const [arrivingRoutes, setArrivingRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stationName, setStationName] = useState<string | null>(null);

  // Function to fetch station data
  const fetchNearestStationData = async () => {
    try {
      const requestEndpoint = `${API_BASE_URL}/stations/nearest_station`;
      const { latitude, longitude } = globalLocationData;
      console.log('Requesting data from:', requestEndpoint);
      const response = await fetch(requestEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const station = await response.json();
      setStationName(station.name);
      setArrivingRoutes(station.arrivingRoutes);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearestStationData(); // initial request
    const intervalId = setInterval(fetchNearestStationData, 10000); // every 10 seconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <SafeAreaView className='bg-white h-full'>
      <ScrollView contentContainerClassName='h-full justify-center items-center'>
        <Text className='font-bold text-3xl my-10 font-spaceMono text-center'>
          Orienta Fácil
        </Text>
        {loading && <Text>Cargando información de la estación...</Text>}
        {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}
        {!loading && <Text>Rutas que están llegando a {stationName}:</Text>}
        {!loading && (
          <View style={{ width: '100%' }}>
            {arrivingRoutes.map((item, index) => (
              <View
                key={index}
                style={{
                  marginBottom: 8,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 4,
                }}
              >
                <Text>{item.route}</Text>
                <Text>Destino: {item.destination}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EasyGuide;
