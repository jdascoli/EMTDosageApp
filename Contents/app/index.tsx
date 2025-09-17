import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const NotificationScreen: React.FC = () => {
  const router = useRouter();

  const onClose = () => {
    router.replace('/(tabs)/homePage');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is a notification!</Text>
      <Button title="Continue" onPress={onClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" },
  text: { fontSize: 20, marginBottom: 20 }
});

export default NotificationScreen;
