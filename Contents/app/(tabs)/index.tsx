import { useState } from "react";
import { router } from 'expo-router';
import { FlatList, TouchableOpacity, StyleSheet, useColorScheme, Text, View, TextInput, Modal } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { WarningPopup } from '@/components/warningPopup.tsx';
import { Ionicons } from '@expo/vector-icons';
import { SearchHistory } from "@/components/SearchHistory";
import { useSearchHistory } from "@/hooks/useSearchHistory";

const medications = [
  { id: "1", name: "Epinephrine" },
  { id: "2", name: "Aspirin" },
  { id: "3", name: "Nitroglycerin" },
  { id: "4", name: "Albuterol" },
  { id: "5", name: "Naloxone" },
];
        
let hasShownWarningThisSession = false;

export default function HomeScreen() {
  const scheme = useColorScheme();
  const {addSearchTerm} = useSearchHistory();
  const [search, setSearch] = useState("");
  const [showWarning, setShowWarning] = useState(!hasShownWarningThisSession);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortOption, setSortOption] = useState<"default" | "az" | "za">("default");

   const handleCloseWarning = () => {
    setShowWarning(false);
    hasShownWarningThisSession = true;
  };

  const handlePress = (medName: string) => {
    console.log(`Clicked: ${medName}`);
    addSearchTerm(medName);
    router.push(`/medication/${medName}`);
  };

  const handleCancelSearch = () => {
    setSearch("");
  }

  const handleSearchChange = (text: string) => {
    setSearch(text);
  };

  let filteredMeds = medications.filter((med) => med.name.toLowerCase().includes(search.toLowerCase()));
  if (sortOption === "az") filteredMeds = filteredMeds.slice().sort((a, b) => a.name.localeCompare(b.name));
  else if (sortOption === "za") filteredMeds = filteredMeds.slice().sort((a, b) => b.name.localeCompare(a.name));
  

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

      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Medications
        </ThemedText>
        <TouchableOpacity onPress={() => setFilterVisible(true)}>
          <Ionicons name="filter" size={28} color={scheme === "dark" ? "#f7fafc" : "#2d3748"} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput placeholder="Search medications..." placeholderTextColor={scheme === "dark" ? "#a0aec0" : "#6c757d"}
          style={[styles.searchInput, scheme === "dark" ? styles.searchInputDark : styles.searchInputLight ]}
          value={search} onChangeText={setSearch} returnKeyType="search" onSubmitEditing={() => {
          if (search.trim().length > 0) { addSearchTerm(search) }}}/>
          {search.length > 0 && (
            <TouchableOpacity onPress={handleCancelSearch} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>X</Text> 
            </TouchableOpacity>)}
      </View>

      {/* Search History Component */}
      <SearchHistory onSearchTermSelect={handleSearchChange} />

      {/* Med list */}

      <FlatList data={filteredMeds} renderItem={renderItem} keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}/>
       {showWarning && <WarningPopup onClose={handleCloseWarning} />}

      {/* Filter Modal */}
      <Modal visible={filterVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, scheme === "dark" ? styles.modalDark : styles.modalLight]}>
            <Text style={styles.modalTitle}>Sort Medications</Text>
            <TouchableOpacity onPress={() => { setSortOption("default"); setFilterVisible(false); }}>
              <Text style={styles.modalOption}>Default</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSortOption("az"); setFilterVisible(false); }}>
              <Text style={styles.modalOption}>A → Z</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSortOption("za"); setFilterVisible(false); }}>
              <Text style={styles.modalOption}>Z → A</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilterVisible(false)}>
              <Text style={[styles.modalOption, { color: "red" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ThemedView>


  );
}

const styles = StyleSheet.create({

  container: { flex: 1, padding: 16, paddingTop: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { marginBottom: 0 },
  subtitle: { marginBottom: 10, fontSize: 16 },

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

  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { padding: 20, borderRadius: 12, width: 250, borderWidth: 1, borderColor: "#000" },
  modalLight: { backgroundColor: "#fff" },
  modalDark: { backgroundColor: "#2d3748" },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  modalOption: { marginVertical: 6, fontSize: 16, paddingVertical: 12,  paddingHorizontal: 16, borderWidth: 1,
  borderColor: "#000", borderRadius: 8, backgroundColor: "#fff", textAlign: "center" }
});