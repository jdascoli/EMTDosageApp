import { View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { ThemedText } from "@/components/ThemedText";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";

interface SearchHistoryProps {
  onSearchTermSelect: (term: string) => void;
}

export function SearchHistory({ onSearchTermSelect }: SearchHistoryProps) {
  const { recentSearches, isLoading, clearHistory, removeSearchTerm } = useSearchHistory();
  const scheme = useColorScheme();

  // Don't show anything if there are no recent searches
  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Header with title and clear button */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <ThemedText style={{ fontSize: 14, fontWeight: "600" }}>
          Recent Searches
        </ThemedText>

        <Pressable onPress={clearHistory} style={{ padding: 4 }}>
          <Text
            style={{
              color: scheme === "dark" ? "#ff7b72" : "#d1242f",
              fontSize: 14,
            }}
          >
            Clear All
          </Text>
        </Pressable>
      </View>

      {/* Loading indicator */}
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={scheme === "dark" ? "#58a6ff" : "#0969da"}
        />
      ) : (
        /* List of recent searches */
        <FlatList
          data={recentSearches}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12,
              paddingVertical: 6, borderRadius: 16, marginRight: 8, 
              backgroundColor: scheme === "dark" ? "#21262d" : "#f6f8fa", borderWidth: 1,
              borderColor: scheme === "dark" ? "#30363d" : "#d0d7de",}}>
            <Pressable onPress={() => onSearchTermSelect(item.term)} style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: scheme === "dark" ? "#e6edf3" : "#1f2328" }}>
                {item.term}
              </Text>
            </Pressable>
            <Pressable onPress={() => removeSearchTerm(item.id)} style={{ marginLeft: 6 }}>
              <Ionicons name="close-circle" size={16} color={scheme === "dark" ? "#f7fafc" : "#2d3748"} />
            </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}