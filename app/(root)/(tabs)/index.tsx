import { Link } from "expo-router";
import { Text, View, Image } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image/>
      <Text className="font-bold text-3xl my-10 font-spaceMono">Bienveido a OrientApp!</Text>
      <Link href="/select-bus-route">SelectBusRoute</Link>
      <Link href="/easy-guide">EasyGuide</Link>
      <Link href="/user-guide">UserGuide</Link>
    </View>
  );
}
