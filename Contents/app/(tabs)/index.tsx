import { useState } from "react";
import { router } from 'expo-router';
import { FlatList, TouchableOpacity, StyleSheet, useColorScheme, Text, View, TextInput } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { WarningPopup } from '../warningPopup.tsx';

const medications = [
  { id: "1", name: "Epinephrine" },
  { id: "2", name: "Aspirin" },
  { id: "3", name: "Nitroglycerin" },
  { id: "4", name: "Albuterol" },
  { id: "5", name: "Naloxone" },
];

export default function HomeScreen() {
  const scheme = useColorScheme();
  const [search, setSearch] = useState("");

  const handlePress = (medName: string) => {
    console.log(`Clicked: ${medName}`);
    router.push(`/medication/${medName}`);
  };

  const handleCancelSearch = () => {
    setSearch("");
  }

  const filteredMeds = medications.filter((med) =>
    med.name.toLowerCase().includes(search.toLowerCase())
  );

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
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput placeholder="Search medications..." placeholderTextColor={scheme === "dark" ? "#a0aec0" : "#6c757d"}
          style={[styles.searchInput, scheme === "dark" ? styles.searchInputDark : styles.searchInputLight ]}
          value={search}onChangeText={setSearch} />
      </View>
      <FlatList
        data={filteredMeds}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
      {/* */}
      {search.length > 0 && (
        <View style={styles.cancelButtonContainer}>
          <TouchableOpacity onPress={handleCancelSearch} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      <WarningPopup />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { marginBottom: 20 },
  searchContainer: { marginBottom: 16 },
  searchInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 16 },
  searchInputLight: { backgroundColor: "#f8f9fa", borderColor: "#e9ecef", color: "#2d3748" },
  searchInputDark: { backgroundColor: "#2d3748", borderColor: "#4a5568", color: "#f7fafc" },
  list: { gap: 12 },
  itemContainer: { padding: 16, borderRadius: 12, borderWidth: 1, minHeight: 56 },
  itemContainerLight: { backgroundColor: "#f8f9fa", borderColor: "#e9ecef" },
  itemContainerDark: { backgroundColor: "#2d3748", borderColor: "#4a5568" },
  itemText: { fontSize: 16, fontWeight: "500" },
  itemTextLight: { color: "#2d3748" },
  itemTextDark: {color: "#f7fafc" },
  cancelButtonContainer: { 
    alignItems: 'flex-end', marginTop: 10,},
  cancelButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  cancelButtonText: {
    color:'#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});