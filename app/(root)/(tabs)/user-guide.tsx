import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native'
import React from 'react'
import { router } from 'expo-router'

const UserGuide = () => {
  return (
    <SafeAreaView>
      <Text>UserGuide</Text>
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