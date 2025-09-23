import React, { useState } from "react";
import { router } from "expo-router";
import {
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Text,
  View,
  TextInput,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SearchHistory } from "@/components/SearchHistory";
import { useSearchHistory } from "@/hooks/useSearchHistory";

const medications = [
  { id: "1", name: "Epinephrine" },
  { id: "2", name: "Aspirin" },
  { id: "3", name: "Nitroglycerin" },
  { id: "4", name: "Albuterol" },
  { id: "5", name: "Naloxone" },
];

export default function HomeScreen() {
  const scheme = useColorScheme();
  const [searchText, setSearchText] = useState("");
  const { addSearchTerm } = useSearchHistory();

  // This will be called when someone clicks a recent search term
  const handleSearchTermSelect = (term: string) => {
    setSearchText(term);
  };

  const handlePress = (medName: string) => {
    console.log(`Clicked: ${medName}`);
    // Save the search term when medication is clicked
    addSearchTerm(medName);
    router.push(`/medication/${medName}`);
  };

  // Search function
  const filteredMedications = medications.filter((med) =>
    med.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Save search when user types
  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const renderItem = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        scheme === "dark"
          ? styles.itemContainerDark
          : styles.itemContainerLight,
      ]}
      onPress={() => handlePress(item.name)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.itemText,
          scheme === "dark" ? styles.itemTextDark : styles.itemTextLight,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Medications
      </ThemedText>

      {/* Simple Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            scheme === "dark"
              ? styles.searchInputDark
              : styles.searchInputLight,
          ]}
          placeholder="Search medications..."
          placeholderTextColor={scheme === "dark" ? "#a0aec0" : "#718096"}
          value={searchText}
          onChangeText={handleSearchChange}
        />
      </View>

      {/* Search History Component */}
      <SearchHistory onSearchTermSelect={handleSearchTermSelect} />

      {/* Search Results */}
      <ThemedText style={styles.subtitle}>
        {searchText
          ? `Search Results (${filteredMedications.length})`
          : "All Medications"}
      </ThemedText>

      <FlatList
        data={filteredMedications}
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
  title: { marginBottom: 20, textAlign: "center" },
  subtitle: { marginBottom: 10, fontSize: 16 },
  searchContainer: { marginBottom: 16 },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchInputLight: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
    color: "#2d3748",
  },
  searchInputDark: {
    backgroundColor: "#2d3748",
    borderColor: "#4a5568",
    color: "#f7fafc",
  },
  list: { gap: 12 },
  itemContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 56,
  },
  itemContainerLight: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
  },
  itemContainerDark: {
    backgroundColor: "#2d3748",
    borderColor: "#4a5568",
  },
  itemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemTextLight: {
    color: "#2d3748",
  },
  itemTextDark: {
    color: "#f7fafc",
  },
});
