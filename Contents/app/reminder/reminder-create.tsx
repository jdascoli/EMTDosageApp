import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View, FlatList, useColorScheme, TextInput } from 'react-native';
import { useLayoutEffect, useState } from 'react';// added for useState
import { WarningPopup } from '@/components/warningPopup.tsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAllReminders, addNewReminder, removeReminder } from "@/database/medications";
import PushNotification from "react-native-push-notification";


export default function ReminderCreateScreen() {
  const [message, setMessage] = useState("");
  const [time, setTime] = useState(new Date());
  const [mode, setMode] = useState('time'); // 'date' or 'time'
  const [showDatePicker, setShowDatePicker] = useState(false); // 'date' or 'time'
  const [requirementMessage, setReqMessage] = useState("")
  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const scheme = useColorScheme();

  useLayoutEffect(() => {
  }, []);

  const handleMessageChange = (text: string) => {
    if (text === "" || /^[a-zA-Z0-9 ]+$/.test(text)) {
      setMessage(text);
    }
  };

  const onTimeChange = (event, selectedDate) => {
    if (selectedDate) {
        setTime(selectedDate);
        setShowDatePicker(false)
    }
  };

  const showMode = (currentMode) => {
    setShowDatePicker(true);
    setMode(currentMode);
  };

  const sendNotification = (iMessage: string) => {
      return;
  }

  const handleConfirm = () => {
    // Create New Reminder in Database
    // Set Notification on Phone
    if(message == ""){
      setReqMessage("* Please Set Message");
      return;
    }
    addNewReminder(message, formattedTime);
    //sendNotification(message);
    console.log("Reminder Created");
    router.replace(`/reminders`);
  };

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

    {/* Back Button */}
    <TouchableOpacity onPress={() => router.replace(`/reminders`)}>
      <Text style={styles.backButtonText}>← Back</Text>
    </TouchableOpacity>

    {/* Title */}
    <ThemedView style={styles.titleContainer}>
      <ThemedText type="title">Reminder Creation</ThemedText>
    </ThemedView>

    {/* Message Input Field */}
    <View style={styles.inputRow}>
      <Text style={{ color: scheme === "dark" ? "#f8fafc" : "#111" }}>Message:</Text>
      <TextInput
        style={[styles.input1,{
            backgroundColor: scheme === "dark" ? "#1e293b" : "#fff",
            color: scheme === "dark" ? "#f8fafc" : "#111",
            borderColor: scheme === "dark" ? "#475569" : "gray"
          }
        ]}
        placeholder="Example Message..."
        placeholderTextColor={scheme === "dark" ? "#94a3b8" : "#999"}
        value={message}
        onChangeText={handleMessageChange}
        keyboardType="default"
      />
    </View>

    {/* Time Field */}
    <View style={styles.inputRow}>
    <Text style={{ color: scheme === "dark" ? "#f8fafc" : "#111" }}>Time: {formattedTime}</Text>
    <TouchableOpacity style={styles.timeButton} onPress={() => showMode('time')}>
      <Text style={styles.timeButtonText}>Select Time</Text>
    </TouchableOpacity>
    {showDatePicker && (
      <DateTimePicker
        value={time}
        mode={mode}
        display="default"
        onChange={onTimeChange}
      />
    )}
    </View>

    {/* Confirm Button */}
    <TouchableOpacity
      style={[styles.confirmButton]}
      onPress={handleConfirm}>
      <Text style={styles.confirmButtonText}>Confirm</Text>
    </TouchableOpacity>

    <Text style={{color:"red"}}>{requirementMessage}</Text>

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
  timeButton: {
    backgroundColor: '#4CAF50',    // green background
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  timeButtonText: {
    color: '#fff',                // white text
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: "rgba(0, 122, 255, 1.0)",
    padding: 5,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 2,
    marginHorizontal: 5,
    width: 160,
    height: 40,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

