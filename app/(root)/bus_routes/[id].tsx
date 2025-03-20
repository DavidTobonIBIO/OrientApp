import { View, Text } from 'react-native'
import {useState, useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router';
import { TransmilenioRoute } from '@/constants/transmilenioRoutes';
const API_BASE_URL = process.env.EXPO_PUBLIC_ARRIVING_BUSES_API_BASE_URL;

const BusRoute = () => {

	const { id } = useLocalSearchParams<{ id?: string }>();
	
	const [route, setRoute] = useState<TransmilenioRoute | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchRouteData = async () => {
			if (!id) return;
			
			try {
				setLoading(true);
				const response = await fetch(`${API_BASE_URL}/routes/${id}/`);
				
				if (!response.ok) {
					throw new Error(`Failed to fetch route: ${response.status}`);
				}
				
				const data = await response.json();
				setRoute(data);
			} catch (err) {
				console.error("Error fetching route data:", err);
				setError(err instanceof Error ? err.message : "Failed to fetch route data");
			} finally {
				setLoading(false);
			}
		};

		fetchRouteData();
	}, [id]);

	return (
		<View>
			<Text>BusRoute {id}</Text>
			{route && <Text>{`${route.name}`}</Text>}
		</View>
	);
};

export default BusRoute