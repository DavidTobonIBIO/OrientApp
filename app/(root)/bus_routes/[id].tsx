import { View, Text } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router';

const BusRoute = () => {

	const { id } = useLocalSearchParams<{ id?: string }>();

  return (
	<View>
	  <Text>BusRoute {id}</Text>
	</View>
  );
};

export default BusRoute