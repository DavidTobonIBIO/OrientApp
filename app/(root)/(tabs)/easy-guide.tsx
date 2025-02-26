import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ScrollView, SafeAreaView } from 'react-native';

// Access the base URL from your environment variable.
// Depending on your setup, you might need a library like "react-native-dotenv" or Expo Constants.
const API_BASE_URL = process.env.EXPO_PUBLIC_ARRIVING_BUSES_API_BASE_URL;
let stationName = 'Universidades'; // Replace with your dynamic station name if needed

const EasyGuide = () => {
  const [arrivingRoutes, setArrivingRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch station data
  const fetchStationData = async () => {
    try {
      stationName = stationName.replace(' ', '_').toLowerCase();
      const requestEndpoint = `${API_BASE_URL}/stations/${stationName}`;
      console.log('Requesting data from:', requestEndpoint);
      const response = await fetch(requestEndpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const station = await response.json();
      setArrivingRoutes(station.arrivingRoutes);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // useEffect to make the initial request and then set up an interval to fetch every 10 seconds
  useEffect(() => {
    fetchStationData(); // initial request
    const intervalId = setInterval(fetchStationData, 10000); // every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
     <SafeAreaView className="bg-white h-full">
        <ScrollView contentContainerClassName="h-full justify-center items-center">
        <View className='items-center'>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
            Orienta Fácil
          </Text>
          {loading && <Text>Loading station data...</Text>}
          {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}
          {!loading && arrivingRoutes.length === 0 && (
            <Text>No arriving routes available.</Text>
          )}
          {!loading && arrivingRoutes.length > 0 && (
            <FlatList
              data={arrivingRoutes}
              keyExtractor={(item, index) => index.toString()} // If Bus objects have an id, use that instead.
              renderItem={({ item }) => (
                <View
                  style={{
                    marginBottom: 8,
                    padding: 8,
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 4,
                  }}
                >
                  {/* Customize below as per your Bus object structure */}
                  <Text>Route: {item.routeName || 'Unknown Route'}</Text>
                  <Text>Bus: {item.busNumber || 'Unknown Bus'}</Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EasyGuide;
