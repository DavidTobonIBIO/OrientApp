import icons from "@/constants/icons";
import { Link } from "expo-router";
import { Text, View, Image, ScrollView, SafeAreaView, TouchableOpacity } from "react-native";

export default function Index() {
 
  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerClassName="h-full justify-center items-center">
        <Image source={icons.orientapp} className="w-5/6" resizeMode="contain" />
        <View className="items-center w-5/6">
          <Text className="font-bold text-3xl my-10 font-spaceMono text-center">
            Bienvenido a OrientApp!
          </Text>
          
          <Link href="/select-bus-route" asChild>
            <TouchableOpacity className="bg-dark-blue p-4 rounded-md my-2 w-5/6">
              <Text className="text-white text-center">SelectBusRoute</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/easy-guide" asChild>
            <TouchableOpacity className="bg-dark-blue p-4 rounded-md my-2 w-5/6">
              <Text className="text-white text-center">Orienta Fácil</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/user-guide" asChild>
            <TouchableOpacity className="bg-dark-blue p-4 rounded-md my-2 w-5/6">
              <Text className="text-white text-center">UserGuide</Text>
            </TouchableOpacity>
          </Link>
          {/* <Link href="/bus-routes/1" asChild>
            <TouchableOpacity className="bg-dark-blue p-4 rounded-md my-2 w-5/6">
              <Text className="text-white text-center">BusRoutes</Text>
            </TouchableOpacity>
          </Link> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}