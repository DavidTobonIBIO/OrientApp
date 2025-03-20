import * as TaskManager from 'expo-task-manager';

export const LOCATION_TASK_NAME = 'background-location-task';

// Global variable to store the latitude and longitude
export let globalLocationData: { latitude: number; longitude: number } = {
  latitude: 0,
  longitude: 0,
};

// Background task to handle location updates
// This task is defined in the app's entry file (app.tsx) to ensure it's registered when the app starts
TaskManager.defineTask(
  LOCATION_TASK_NAME,
  async (taskData: { data?: any; error?: any }) => {
    const { data, error } = taskData;
    if (error) {
      console.error('Location task error:', error);
      return;
    }
    if (data) {
      const { locations } = data;
      if (locations && locations.length > 0) {
        const { coords } = locations[0];
        globalLocationData = { latitude: coords.latitude, longitude: coords.longitude };
        console.log('Location update:', globalLocationData);
      }
    }
  }
);

