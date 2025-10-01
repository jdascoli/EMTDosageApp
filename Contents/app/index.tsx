import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const NotificationScreen: React.FC = () => {
  const router = useRouter();

  const onClose = () => {
    router.replace("/(tabs)/homePage");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.warningText}>Warning!</Text>
      <Text style={styles.text}>This App is Advisory Only!</Text>
      <Button title="Continue" color="maroon" onPress={onClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  text: { fontSize: 20, color: "black", marginBottom: 70 },
  warningText: { fontSize: 27, color: "red", marginBottom: 15 },
});

export default NotificationScreen;
