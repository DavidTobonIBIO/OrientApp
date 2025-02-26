import * as TaskManager from 'expo-task-manager';

export const ARRIVING_ROUTES_TASK_NAME = 'background-api-arriving-routes-task';

export let arrivingRoutes: { id: string, route: string }[] | null= null;

TaskManager.defineTask(
    ARRIVING_ROUTES_TASK_NAME,
    
)