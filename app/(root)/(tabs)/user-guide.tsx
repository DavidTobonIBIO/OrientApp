import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { router } from 'expo-router'

const UserGuide = () => {
  return (
    <SafeAreaView className="bg-white h-full">
      <View className="p-8">
        <Text className="font-bold text-4xl text-center mb-8">Guía de Usuario</Text>
        
        <ScrollView className="flex-1">
          <View className="mb-6">
            <Text className="text-2xl font-bold mb-2">Cómo usar OrientApp</Text>
            <Text className="text-xl">
              OrientApp te ayuda a navegar por el sistema de transporte público de manera sencilla.
              Encuentra rutas, horarios y ubicaciones de estaciones de forma rápida.
            </Text>
          </View>
          
          <View className="mb-6">
            <Text className="text-2xl font-bold mb-2">Funciones principales</Text>
            <Text className="text-xl mb-2">• Ruta por voz: Di el número de la ruta que necesitas</Text>
            <Text className="text-xl mb-2">• Seleccionar Ruta: Explora todas las rutas disponibles</Text>
            <Text className="text-xl mb-2">• Orienta Fácil: Ver todas las rutas que pasan por tu ubicación actual</Text>
          </View>
          
          <View className="mb-6">
            <Text className="text-2xl font-bold mb-2">Consejos</Text>
            <Text className="text-xl mb-2">• Asegúrate de tener el GPS activado para mejor precisión</Text>
            <Text className="text-xl mb-2">• Habla claramente al usar la función de voz</Text>
            <Text className="text-xl mb-2">• Revisa la información de llegada para planificar mejor</Text>
          </View>
        </ScrollView>
      </View>
      
      <View className="w-full flex-row justify-center mt-8 mb-4 px-4">
        <TouchableOpacity
          className="bg-red-800 py-11 rounded-2xl w-2/5 mx-2"
          onPress={() => router.replace("/")}
        >
          <Text className="text-white text-center text-3xl font-bold">Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
};

export default UserGuide;