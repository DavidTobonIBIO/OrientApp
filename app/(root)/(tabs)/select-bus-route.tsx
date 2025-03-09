import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { Link } from "expo-router";

export default function SelectBusRoute() {
  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerClassName="h-full justify-center items-center p-5">
        {/* Title Section */}
        <View className="w-full mb-6">
          <Text className="text-4xl font-bold">Te encuentras en:</Text>
          <Text className="text-3xl italic text-gray-700">UNIVERSIDADES</Text>
        </View>

        {/* Large Route Buttons */}
        <TouchableOpacity className="w-5/6 py-6 bg-green-700 rounded-2xl my-4">
          <Text className="text-center text-white text-3xl font-bold">B10</Text>
        </TouchableOpacity>

        <TouchableOpacity className="w-5/6 py-6 bg-pink-600 rounded-2xl my-4">
          <Text className="text-center text-white text-3xl font-bold">J24</Text>
        </TouchableOpacity>

        <TouchableOpacity className="w-5/6 py-6 bg-yellow-600 rounded-2xl my-4">
          <Text className="text-center text-white text-3xl font-bold">C73</Text>
        </TouchableOpacity>

        <TouchableOpacity className="w-5/6 py-6 bg-orange-700 rounded-2xl my-4">
          <Text className="text-center text-white text-3xl font-bold">H20</Text>
        </TouchableOpacity>

        {/* Larger Navigation Buttons */}
        <View className="w-full flex-row justify-between mt-8">
          <Link href="/" asChild>
            <TouchableOpacity className="bg-gray-900 py-11 rounded-2xl w-2/5 mx-2">
              <Text className="text-white text-center text-3xl font-bold">Volver</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/other-route" asChild>
            <TouchableOpacity className="bg-gray-900 py-11 rounded-2xl w-2/5 mx-2">
              <Text className="text-white text-center text-3xl font-bold">Otra</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
