import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SearchHistoryItem {
  id: number;
  term: string;
  timestamp: string;
}

const STORAGE_KEY = "@medicationSearchHistory";

export function useSearchHistory() {
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load search history from AsyncStorage on component mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      console.log("Loaded from storage:", stored); // Debug log

      if (stored) {
        const history = JSON.parse(stored) as SearchHistoryItem[];
        setRecentSearches(history);
      } else {
        setRecentSearches([]);
      }
    } catch (error) {
      console.error("Error loading search history:", error);
      setRecentSearches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addSearchTerm = async (term: string) => {
    if (!term.trim()) return;

    const cleanTerm = term.trim().toLowerCase();
    const newItem: SearchHistoryItem = {
      id: Date.now(),
      term: cleanTerm,
      timestamp: new Date().toISOString(),
    };

    try {
      // Get current searches first
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let currentSearches: SearchHistoryItem[] = [];

      if (stored) {
        currentSearches = JSON.parse(stored) as SearchHistoryItem[];
      }

      // Remove duplicates and keep only last 5 searches
      const filtered = currentSearches.filter(
        (item) => item.term !== newItem.term
      );
      const updated = [newItem, ...filtered].slice(0, 5);

      // Save to AsyncStorage and update state
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
      console.log("Search term saved:", cleanTerm);
    } catch (error) {
      console.error("Error saving search term:", error);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setRecentSearches([]);
      console.log("Search history cleared");
    } catch (error) {
      console.error("Error clearing search history:", error);
    }
  };

  const removeSearchTerm = async (id: number) => {
    try {
      const updated = recentSearches.filter((item) => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
      console.log("Removed search term with id:", id);
    } catch (error) {
      console.error("Error removing search term:", error);
    }
  };

  return {
    recentSearches,
    isLoading,
    addSearchTerm,
    clearHistory,
    removeSearchTerm,
    refresh: loadRecentSearches,
  };
}
