import { useEffect } from "react";
import { router } from "expo-router";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  useEffect(() => {
    // Root Layout mount waiting for a moment before redirecting to login
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}