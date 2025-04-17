import { useState, useRef, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// API endpoint for voice recognition
const API_BASE_URL = process.env.EXPO_PUBLIC_ORIENTAPP_API_BASE_URL || 'http://localhost:8000/api';

// Types from context to match backend schema
export interface Route {
  id: number;
  name: string;
  destinationStationId: number;
}

export interface VoiceCommandResult {
  routes?: Route[];
  text?: string;
  confidence?: number;
}

interface UseVoiceCommandsReturn {
  isRecording: boolean;
  isProcessing: boolean;
  lastResult: VoiceCommandResult | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  processVoiceCommand: (audioUri: string) => Promise<VoiceCommandResult | null>;
}

/**
 * Hook for handling voice commands recording and processing
 * @param recordingDuration Optional duration in ms for auto-stop (default: 4000ms)
 * @returns Voice command functions and state
 */
export function useVoiceCommands(recordingDuration = 4000): UseVoiceCommandsReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Using ref to avoid state-related issues with async operations
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Request audio permissions and start recording
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Already recording - stop it first
      if (isRecording) {
        await stopRecording();
        return;
      }
      
      console.log('Requesting audio permissions...');
      const { granted } = await Audio.requestPermissionsAsync();
      
      if (!granted) {
        setError('Permisos de audio no concedidos');
        Alert.alert(
          'Permiso denegado',
          'Se requiere permiso de grabación de audio para usar comandos de voz.'
        );
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        // Using numeric values instead of constants
        interruptionModeIOS: 1, // Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX
        interruptionModeAndroid: 1, // Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
      });

      // Start new recording
      console.log('Starting recording...');
      const newRecording = new Audio.Recording();
      
      // Using preset options with small modifications
      await newRecording.prepareToRecordAsync(
        Platform.OS === 'ios'
          ? {
              ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
              ios: {
                ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
                extension: '.wav',
              },
            }
          : {
              ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
              android: {
                ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
                extension: '.wav',
              },
            }
      );
      
      await newRecording.startAsync();
      
      recordingRef.current = newRecording;
      setIsRecording(true);

      // Set timer to auto-stop recording
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      
      recordingTimerRef.current = setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, recordingDuration);
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Error al iniciar la grabación');
      setIsRecording(false);
    }
  }, [isRecording, recordingDuration]);

  /**
   * Stop active recording and process the audio
   */
  const stopRecording = useCallback(async () => {
    // Clear auto-stop timer
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const recording = recordingRef.current;
    if (!recording) {
      setIsRecording(false);
      return;
    }

    try {
      console.log('Stopping recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      recordingRef.current = null;
      setIsRecording(false);

      if (uri) {
        console.log('Recording stored at', uri);
        await processVoiceCommand(uri);
      } else {
        setError('No se pudo obtener el archivo de audio');
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Error al detener la grabación');
      setIsRecording(false);
    }
  }, []);

  /**
   * Process recorded audio and send to API
   */
  const processVoiceCommand = useCallback(async (audioUri: string): Promise<VoiceCommandResult | null> => {
    if (!audioUri) {
      setError('URI de audio inválido');
      return null;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Archivo de audio no encontrado');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('audio', {
        uri: fileInfo.uri,
        name: 'voice-input.wav',
        type: 'audio/wav',
      } as any);

      // Send to API
      const response = await fetch(`${API_BASE_URL}/voice/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      // Process response
      const routes = await response.json();
      console.log('Voice API Response:', routes);
      
      if (!response.ok) {
        throw new Error(typeof routes.detail === 'string' ? routes.detail : 'Error en la respuesta del API');
      }
      
      // API now returns an array of Route objects
      const result: VoiceCommandResult = {
        routes: routes,
      };
      
      // Save and return result
      setLastResult(result);
      setIsProcessing(false);
      return result;
      
    } catch (error) {
      console.error('Error processing voice command:', error);
      setError('Error al procesar el comando de voz');
      setIsProcessing(false);
      return null;
    }
  }, []);

  return {
    isRecording,
    isProcessing,
    lastResult,
    error,
    startRecording,
    stopRecording,
    processVoiceCommand,
  };
}

export default useVoiceCommands; 