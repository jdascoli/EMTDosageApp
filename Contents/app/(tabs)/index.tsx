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

function alphabeticalList() {
  return medications.slice().sort((a, b) => a.name.localeCompare(b.name));
}
        
let hasShownWarningThisSession = false;

export default function HomeScreen() {
  const scheme = useColorScheme();
  const [search, setSearch] = useState("");
  const [showWarning, setShowWarning] = useState(!hasShownWarningThisSession);

   const handleCloseWarning = () => {
    setShowWarning(false);
    hasShownWarningThisSession = true;
  };

  const handlePress = (medName: string) => {
    console.log(`Clicked: ${medName}`);
    // TODO: navigate to specific dosage calculator screen
    router.push(`/medication/${medName}`);
  };

  const handleCancelSearch = () => {
    setSearch("");
  }

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
      <Text></Text> 
      <ThemedText type="title" style={styles.title}>
        Medications
      </ThemedText>

      <FlatList data={alphabeticalList()} renderItem={renderItem} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} />
      {showWarning && <WarningPopup onClose={handleCloseWarning} />}
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput placeholder="Search medications..." placeholderTextColor={scheme === "dark" ? "#a0aec0" : "#6c757d"}
          style={[styles.searchInput, scheme === "dark" ? styles.searchInputDark : styles.searchInputLight ]}
          value={search} onChangeText={setSearch} />
          {search.length > 0 && (
            <TouchableOpacity onPress={handleCancelSearch} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>X</Text> 
            </TouchableOpacity>
  )}
      </View>
      <FlatList data={medications} renderItem={renderItem} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}/>
       {showWarning && <WarningPopup onClose={handleCloseWarning} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { marginBottom: 20 },
  searchContainer: { position: "relative", marginBottom: 16 },
  searchInput: { padding: 12, paddingRight: 40, borderRadius: 10, borderWidth: 1, fontSize: 16 },
  searchInputLight: { backgroundColor: "#f8f9fa", borderColor: "#e9ecef", color: "#2d3748" },
  searchInputDark: { backgroundColor: "#2d3748", borderColor: "#4a5568", color: "#f7fafc" },
  list: { gap: 12 },
  itemContainer: { padding: 16, borderRadius: 12, borderWidth: 1, minHeight: 56 },
  itemContainerLight: { backgroundColor: "#f8f9fa", borderColor: "#e9ecef" },
  itemContainerDark: { backgroundColor: "#2d3748", borderColor: "#4a5568" },
  itemText: { fontSize: 16, fontWeight: "500" },
  itemTextLight: { color: "#2d3748" },
  itemTextDark: {color: "#f7fafc" },
  clearButton: { position: "absolute", right: 10, top: "40%", transform: [{ translateY: -10 }], padding: 4 },
  clearButtonText: { fontSize: 18, color: "#888" },
});
