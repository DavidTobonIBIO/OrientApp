import { View, Text } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router';

const BusRoutes = () => {

	const { id } = useLocalSearchParams();

  return (
	<View>
	  <Text>BusRoute {id}</Text>
	</View>
  )
}

export default BusRoutes