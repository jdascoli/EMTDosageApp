import React from "react";
import { FlatList, TouchableOpacity, StyleSheet, useColorScheme, Text } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const medications = [
  { id: "1", name: "Epinephrine" },
  { id: "2", name: "Aspirin" },
  { id: "3", name: "Nitroglycerin" },
  { id: "4", name: "Albuterol" },
  { id: "5", name: "Naloxone" },
];

export default function HomeScreen() {
  const scheme = useColorScheme();

  const handlePress = (medName: string) => {
    console.log(`Clicked: ${medName}`);
    // TODO: navigate to specific dosage calculator screen
  };

  const renderItem = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity 
      style={[styles.itemContainer, scheme === "dark" ? styles.itemContainerDark : styles.itemContainerLight]}
      onPress={() => handlePress(item.name)} activeOpacity={0.7}>
      <Text style={[styles.itemText, scheme === "dark" ? styles.itemTextDark : styles.itemTextLight]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Medications
      </ThemedText>
      <FlatList
        data={medications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { marginBottom: 20 },
  list: { gap: 12 },
  itemContainer: { padding: 16, borderRadius: 12, borderWidth: 1, minHeight: 56 },
  itemContainerLight: { backgroundColor: "#f8f9fa", borderColor: "#e9ecef" },
  itemContainerDark: { backgroundColor: "#2d3748", borderColor: "#  4a5568" },
  itemText: { fontSize: 16, fontWeight: "500" },
  itemTextLight: { color: "#2d3748" },
  itemTextDark: {color: "#f7fafc" }
});