/**
 * Core data models used throughout the application
 */

import { Route } from 'expo-router';

// Location related interfaces
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData extends Coordinates {}

// Station related interfaces
export interface BusRoute {
  id: number;
  name: string;
  destinationStationId: number;
  originStationId: number;
}

export interface Station {
  id: number;
  name: string;
  coordinates: Coordinates;
  arrivingRoutes: BusRoute[];
}

export interface StationData {
  station: Station | null;
  arrivingRoutes: BusRoute[];
  lastUpdated: Date | null;
}

export interface RouteWithDestination {
  route: BusRoute;
  destination: Station;
}

// Time data and calculations
export interface ArrivalTimeInfo {
  time: string | null;
  error: string | null;
  loading: boolean;
}

export interface ArrivalTimesMap {
  [routeId: number]: ArrivalTimeInfo;
}

// Hook related interfaces
export interface UseStationDataProps {
  loadDestinations?: boolean;
}

export interface UseStationDataReturn {
  currentStation: Station | null;
  arrivingRoutes: BusRoute[];
  stationName: string | null;
  loading: boolean;
  error: string | null;
  locationAvailable: boolean;
  routesWithDestinations: RouteWithDestination[];
  refreshStationData: () => void;
}

// Define our own Route-compatible interface
interface RouteParams {
  [key: string]: string | string[] | undefined;
}

// Route parameters
export interface BusRouteParams extends RouteParams {
  id: string;
  routeName: string;
  destinationStationLat: string;
  destinationStationLng: string;
  currentStationName: string;
  currentStationLat: string;
  currentStationLng: string;
} 