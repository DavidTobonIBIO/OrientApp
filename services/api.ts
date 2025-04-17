import { BusRoute, Station } from '@/types/models';

const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL || 'http://localhost:8000/api';
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

/**
 * Fetch the nearest station based on coordinates
 */
export const fetchNearestStation = async (latitude: number, longitude: number): Promise<Station> => {
  try {
    // Skip if we don't have valid coordinates
    if (latitude === 0 && longitude === 0) {
      throw new Error('Invalid coordinates');
    }

    const response = await fetch(`${API_BASE_URL}/stations/nearest_station`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log('Error fetching nearest station:', error);
    throw error;
  }
};

/**
 * Fetch station by ID
 */
export const fetchStationById = async (stationId: number): Promise<Station> => {
  try {
    const response = await fetch(`${API_BASE_URL}/stations/${stationId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching station with ID: ${stationId}`);
    }

    return await response.json();
  } catch (error) {
    console.log(`Error fetching station with ID ${stationId}:`, error);
    throw error;
  }
};

/**
 * Fetch route data from Google Maps API
 */
export const fetchGoogleRouteData = async (
  originLat: number, 
  originLng: number, 
  destinationLat: number, 
  destinationLng: number
) => {
  try {
    const response = await fetch(GOOGLE_MAPS_ROUTES_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask": "routes.legs",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: originLat,
              longitude: originLng
            }
          }
        },
        destination: {
          location: {
            latLng: {
              latitude: destinationLat,
              longitude: destinationLng
            }
          }
        },
        travelMode: "TRANSIT",
        computeAlternativeRoutes: true
      })
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.log('Error fetching Google route data:', error);
    throw error;
  }
};

/**
 * Extract route arrival time from Google Maps response
 */
export const extractRouteArrivalTime = (data: any, routeName: string): string | null => {
  for (const route of data.routes || []) {
    for (const leg of route.legs || []) {
      for (const step of leg.steps || []) {
        if (
          step.travelMode === "TRANSIT" &&
          step.transitDetails?.transitLine?.nameShort === routeName
        ) {
          const departureTime = step.transitDetails?.localizedValues?.departureTime?.time?.text;
          if (departureTime) {
            return departureTime;
          }
        }
      }
    }
  }
  return null;
};

/**
 * Calculate minutes until departure
 */
export const calculateTimeToDeparture = (departureTime: string): number => {
  const now = new Date();
  const [hours, minutes] = departureTime.split(':').map(Number);
  const departure = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  
  // If the calculated time is in the past, it might be for tomorrow
  if (departure < now) {
    departure.setDate(departure.getDate() + 1);
  }
  
  return Math.round((departure.getTime() - now.getTime()) / (1000 * 60));
};

/**
 * Send audio to API for route recognition
 */
export const sendAudioToAPI = async (uri: string, fileInfo: any): Promise<BusRoute[]> => {
  try {
    // Check file extension and type
    const fileExtension = uri.split('.').pop()?.toLowerCase();
    const mimeType = fileExtension === 'm4a' ? 'audio/m4a' : 'audio/wav';
    const fileName = `recording.${fileExtension}`;
    
    // Create form data
    const formData = new FormData();
    formData.append('audio', {
      uri: uri,
      name: fileName,
      type: mimeType,
    } as any);
    
    // Make API request
    const response = await fetch(`${API_BASE_URL}/voice/route`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('API error response:', errorText);
      throw new Error(`Error en la solicitud: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.log('Error sending audio to API:', error);
    throw error;
  }
}; 