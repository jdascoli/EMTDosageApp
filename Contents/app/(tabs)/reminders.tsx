import * as Notifications from 'expo-notifications';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View, FlatList, useColorScheme } from 'react-native';
import { useLayoutEffect, useState } from 'react';// added for useState
import { Picker } from '@react-native-picker/picker';
import { WarningPopup } from '@/components/warningPopup.tsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from "@shopify/flash-list";
import { getAllReminders, removeReminder } from "@/database/medications";


export default function RemindersScreen() {
  const [reminders, setReminders] = useState<{ id: string; description: string; time: string; user_id: number; }[]>([]);
  const scheme = useColorScheme();

  const loadRems = async () => {
    const rems = await getAllReminders();
    setReminders(rems as { id: string; description: string; time: string; user_id: number; }[]);
  };

  useLayoutEffect(() => {
    loadRems();
  }, []);

  const handleDelete = (id: number) => {
      // Removes Item and Reloads List
      removeReminder(id)
      loadRems()
      console.log("Removing Reminder...");
      console.log("Gone!");
  };

  const renderReminder = ({ item }: { item: { id: string; description: string; time: string; user_id: number; } }) => (
    <View style={[styles.itemContainer]}>
      <Text style={[styles.itemText, scheme === "dark" ? styles.itemTextDark : styles.itemTextLight]}>
        {item.time} - {item.description}
      </Text>
      <TouchableOpacity
        style={[styles.deleteButton]}
        onPress={() => handleDelete(parseInt(item.id, 10))} activeOpacity={0.7}>
        <Text style={styles.deleteButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );


  // Running Code
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/reminder_dark.png')}
          style={styles.remindersLogo}
        />
        }
    >
    <ThemedView style={styles.titleContainer}>
      <ThemedText type="title">Reminders</ThemedText>
    </ThemedView>

    {/* Create Reminder Button*/}
    <TouchableOpacity
      style={[styles.createButton]}
      onPress={() => router.replace(`/reminder/reminder-create`)}>
        <Text style={styles.createButtonText}>Create Reminder</Text>
    </TouchableOpacity>

    {/* Reminders List */}
    <FlashList
      data={reminders}
      renderItem={renderReminder}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remindersLogo: {
    height: 256,
    width: 417,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  list: { gap: 12 },
  deleteButton: {
    backgroundColor: 'red',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: 70,
    height: 30,
  },
  deleteButtonText: {color: "#fff", fontSize: 12, fontWeight: "600",},
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
  },
  itemText: { fontSize: 17, fontWeight: "500" },
  itemTextLight: { color: "#2d3748" },
  itemTextDark: { color: "#f7fafc" },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "rgba(0, 122, 255, 1.0)",
    padding: 5,
    borderRadius: 8,
    alignItems: "left",
    marginVertical: 2,
    marginHorizontal: 5,
    width: 160,
    height: 40,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    padding: 10,
    marginBottom: 20,
  },
});


