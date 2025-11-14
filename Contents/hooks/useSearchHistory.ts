import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUserName } from "@/lib/session";

export interface SearchHistoryItem {
  id: number;
  term: string;
  timestamp: string;
}

// const STORAGE_KEY = "@medicationSearchHistory";

export function useSearchHistory() {
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageKey, setStorageKey] = useState<string | null>(null);

  useEffect(() => {
    const loadUserKey = async () => {
      setIsLoading(true);
      try {
        const user = await getCurrentUserName(); //get username
        const key = user ? `@medicationSearchHistory_${user}` : "@medicationSearchHistory_guest";
        setStorageKey(key);
        await loadRecentSearches(key);
      } catch (err) {
        console.error("Error initializing search history:", err);
        setRecentSearches([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const loadRecentSearches = useCallback(async (key: string) => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(key);
      console.log("Loaded from storage:", stored); // Debug log

      if (stored) {
        setRecentSearches(JSON.parse(stored));
      } else {
        setRecentSearches([]);
      }
    } catch (error) {
      console.error("Error loading search history:", error);
      setRecentSearches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addSearchTerm = useCallback(async (term: string) => {
    if (!term.trim()) return;

    const cleanTerm = term.trim().toLowerCase();
    const newItem: SearchHistoryItem = {
      id: Date.now(),
      term: cleanTerm,
      timestamp: new Date().toISOString(),
    };

    try {
      // Get current searches first
      if(!storageKey)return;
      const stored = await AsyncStorage.getItem(storageKey);
      const current = stored ? (JSON.parse(stored) as SearchHistoryItem[]) : [];

      const filtered = current.filter((item) => item.term !== newItem.term);
      const updated = [newItem, ...filtered].slice(0, 10);
      // Save to AsyncStorage and update state
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      setRecentSearches(updated);
      console.log("Search term saved:", cleanTerm);
    } catch (error) {
      console.error("Error saving search term:", error);
    }
  }, [storageKey]);

  const clearHistory = useCallback(async () => {
    if (!storageKey) return;
    try {
      await AsyncStorage.removeItem(storageKey);
      setRecentSearches([]);
      console.log("Search history cleared");
    } catch (error) {
      console.error("Error clearing search history:", error);
    }
  }, [storageKey]);

  const removeSearchTerm = useCallback(async (id: number) => {
    if (!storageKey) return;
    try {
      const updated = recentSearches.filter((item) => item.id !== id);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      setRecentSearches(updated);
      console.log("Removed search term with id:", id);
    } catch (error) {
      console.error("Error removing search term:", error);
    }
  }, [recentSearches, storageKey]);

  return {
    recentSearches,
    isLoading,
    addSearchTerm,
    clearHistory,
    removeSearchTerm,
    refresh: () => storageKey && loadRecentSearches(storageKey),
  };
}
