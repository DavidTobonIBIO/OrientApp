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
      <Link href="/select-bus-route">SelectBusRoute</Link>
      <Link href="/easy-guide">EasyGuide</Link>
      <Link href="/user-guide">UserGuide</Link>
    </View>
  );
}
