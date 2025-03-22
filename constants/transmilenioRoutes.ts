const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL;

export class TransmilenioRoute {
    id: number = 0;
    name: string = '';
    destinationStationId: number = 0;
}

export const fetchRoutes = async (): Promise<TransmilenioRoute[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/routes/`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch routes: ${response.status}`);
        }
        
        const routes = await response.json();
        return routes;
    } catch (error) {
        console.error('Error fetching routes:', error);
        return [];
    }
};

export const getAllRoutes = async (): Promise<TransmilenioRoute[]> => {
    const routes = await fetchRoutes();
    return routes;
};
