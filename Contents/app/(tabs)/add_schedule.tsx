import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  useColorScheme, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAllMedications, getDosagesByMedication } from '@/database/medications';
import { addMedicationSchedule } from '@/database/schedule';
import { getCurrentUserId } from '@/lib/session';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Medication {
  id: number;
  name: string;
  info: string;
  contraindications: string;
  minCert: number;
}

interface Dosage {
  id: number;
  medId: string;
  perKg: number | null;
  unit: string;
  maxDose: number | null;
  fixedDose: number | null;
  minAge: number | null;
  usage: string;
}

export default function AddScheduleScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [dosages, setDosages] = useState<Dosage[]>([]);
  const [selectedDosage, setSelectedDosage] = useState<string>('');
  const [customDosage, setCustomDosage] = useState('');
  const [scheduleTime, setScheduleTime] = useState(new Date());
  const [frequency, setFrequency] = useState('daily');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    if (selectedMedication) {
      loadDosages(selectedMedication.name);
    }
  }, [selectedMedication]);

  const loadMedications = async () => {
    try {
      const meds = await getAllMedications();
      setMedications(meds as Medication[]);
    } catch (error) {
      console.error('Error loading medications:', error);
      Alert.alert('Error', 'Failed to load medications');
    }
  };

  const loadDosages = async (medName: string) => {
    try {
      const dosageData = await getDosagesByMedication(medName);
      setDosages(dosageData);
      if (dosageData.length > 0) {
        const standardDosage = dosageData.find(d => d.usage === 'Standard') || dosageData[0];
        if (standardDosage.fixedDose) {
          setSelectedDosage(`${standardDosage.fixedDose} ${standardDosage.unit}`);
        } else if (standardDosage.perKg) {
          setSelectedDosage(`${standardDosage.perKg} ${standardDosage.unit}/kg`);
        }
      }
    } catch (error) {
      console.error('Error loading dosages:', error);
    }
  };

  const handleAddSchedule = async () => {
    if (!selectedMedication) {
      Alert.alert('Error', 'Please select a medication');
      return;
    }

    const finalDosage = selectedDosage || customDosage.trim();
    if (!finalDosage) {
      Alert.alert('Error', 'Please select or enter a dosage');
      return;
    }

    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      
      if (!userId) {
        Alert.alert('Error', 'Please log in to add schedules');
        return;
      }

      await addMedicationSchedule(
        userId,
        selectedMedication.name,
        selectedMedication.name,
        finalDosage,
        scheduleTime.toTimeString().split(' ')[0].slice(0, 5), // HH:MM format
        frequency,
        startDate.toISOString(),
        endDate ? endDate.toISOString() : undefined
      );

      Alert.alert('Success', 'Medication schedule added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding schedule:', error);
      Alert.alert('Error', 'Failed to add medication schedule');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Time Picker Handler
  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setScheduleTime(selectedTime);
    }
    
    // On Android, close the picker when a time is selected
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
  };

  // Date Picker Handler
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setStartDate(selectedDate);
    }
    
    // On Android, close the picker when a date is selected
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
  };

  // End Date Picker Handler
  const onEndDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setEndDate(selectedDate);
    }
    
    // On Android, close the picker when a date is selected
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
  };

  const clearEndDate = () => {
    setEndDate(null);
  };

  const frequencyOptions = [
    { label: 'Once Daily', value: 'daily' },
    { label: 'Twice Daily', value: 'twice_daily' },
    { label: 'Three Times Daily', value: 'three_times_daily' },
    { label: 'Four Times Daily', value: 'four_times_daily' },
    { label: 'As Needed', value: 'as_needed' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' }
  ];

  // Render Picker Modal for iOS
  const renderPickerModal = (visible: boolean, onClose: () => void, children: React.ReactNode) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View style={styles.pickerModalContent}>
          {children}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Fixed Header - Single Line */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={scheme === 'dark' ? '#f7fafc' : '#2d3748'} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.title}>Add Medication Schedule</ThemedText>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Medication Selection */}
        <View style={styles.section}>
          <Text style={[
            styles.label,
            scheme === 'dark' ? styles.labelDark : styles.labelLight
          ]}>
            Select Medication <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TouchableOpacity 
            style={[
              styles.selectButton,
              scheme === 'dark' ? styles.selectButtonDark : styles.selectButtonLight
            ]}
            onPress={() => setShowMedicationModal(true)}
          >
            <Text style={[
              styles.selectButtonText,
              scheme === 'dark' ? styles.selectButtonTextDark : styles.selectButtonTextLight,
              !selectedMedication && styles.placeholderText
            ]}>
              {selectedMedication ? selectedMedication.name : 'Tap to select medication'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Dosage Selection */}
        {selectedMedication && (
          <View style={styles.section}>
            <Text style={[
              styles.label,
              scheme === 'dark' ? styles.labelDark : styles.labelLight
            ]}>
              Dosage <Text style={styles.requiredStar}>*</Text>
            </Text>
            {dosages.length > 0 ? (
              <View style={[
                styles.pickerContainer,
                scheme === 'dark' ? styles.pickerContainerDark : styles.pickerContainerLight
              ]}>
                {dosages.map((item) => {
                  let dosageText = '';
                  if (item.fixedDose) {
                    dosageText = `${item.fixedDose} ${item.unit}`;
                  } else if (item.perKg) {
                    dosageText = `${item.perKg} ${item.unit}/kg`;
                  }
                  
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.dosageOption,
                        selectedDosage === dosageText && styles.dosageOptionSelected
                      ]}
                      onPress={() => setSelectedDosage(dosageText)}
                    >
                      <Text style={styles.dosageOptionText}>{dosageText} ({item.usage})</Text>
                      {selectedDosage === dosageText && (
                        <Ionicons name="checkmark" size={20} color="#10b981" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <TextInput
                style={[
                  styles.textInput,
                  scheme === 'dark' ? styles.textInputDark : styles.textInputLight
                ]}
                placeholder="Enter dosage (e.g., 81 mg, 2 puffs)"
                placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#6b7280'}
                value={customDosage}
                onChangeText={setCustomDosage}
              />
            )}
          </View>
        )}

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={[
            styles.label,
            scheme === 'dark' ? styles.labelDark : styles.labelLight
          ]}>
            Time <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TouchableOpacity 
            style={[
              styles.selectButton,
              scheme === 'dark' ? styles.selectButtonDark : styles.selectButtonLight
            ]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={[
              styles.selectButtonText,
              scheme === 'dark' ? styles.selectButtonTextDark : styles.selectButtonTextLight
            ]}>
              {formatTime(scheduleTime)}
            </Text>
            <Ionicons name="time-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
          
          {/* Time Picker Modal for iOS */}
          {Platform.OS === 'ios' && renderPickerModal(
            showTimePicker,
            () => setShowTimePicker(false),
            <DateTimePicker
              value={scheduleTime}
              mode="time"
              display="spinner"
              onChange={onTimeChange}
              style={styles.picker}
            />
          )}
          
          {/* Android Time Picker */}
          {Platform.OS === 'android' && showTimePicker && (
            <DateTimePicker
              value={scheduleTime}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}
        </View>

        {/* Frequency Selection */}
        <View style={styles.section}>
          <Text style={[
            styles.label,
            scheme === 'dark' ? styles.labelDark : styles.labelLight
          ]}>
            Frequency <Text style={styles.requiredStar}>*</Text>
          </Text>
          <View style={[
            styles.pickerContainer,
            scheme === 'dark' ? styles.pickerContainerDark : styles.pickerContainerLight
          ]}>
            {frequencyOptions.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.frequencyOption,
                  frequency === item.value && styles.frequencyOptionSelected
                ]}
                onPress={() => setFrequency(item.value)}
              >
                <Text style={[
                  styles.frequencyOptionText,
                  frequency === item.value && styles.frequencyOptionTextSelected
                ]}>
                  {item.label}
                </Text>
                {frequency === item.value && (
                  <Ionicons name="checkmark" size={20} color="#10b981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start Date */}
        <View style={styles.section}>
          <Text style={[
            styles.label,
            scheme === 'dark' ? styles.labelDark : styles.labelLight
          ]}>
            Start Date <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TouchableOpacity 
            style={[
              styles.selectButton,
              scheme === 'dark' ? styles.selectButtonDark : styles.selectButtonLight
            ]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={[
              styles.selectButtonText,
              scheme === 'dark' ? styles.selectButtonTextDark : styles.selectButtonTextLight
            ]}>
              {formatDate(startDate)}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
          
          {/* Start Date Picker Modal for iOS */}
          {Platform.OS === 'ios' && renderPickerModal(
            showStartDatePicker,
            () => setShowStartDatePicker(false),
            <DateTimePicker
              value={startDate}
              mode="date"
              display="spinner"
              onChange={onStartDateChange}
              style={styles.picker}
            />
          )}
          
          {/* Android Start Date Picker */}
          {Platform.OS === 'android' && showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={onStartDateChange}
            />
          )}
        </View>

        {/* End Date (Optional) */}
        <View style={styles.section}>
          <View style={styles.endDateHeader}>
            <Text style={[
              styles.label,
              scheme === 'dark' ? styles.labelDark : styles.labelLight
            ]}>
              End Date (Optional)
            </Text>
            {endDate && (
              <TouchableOpacity onPress={clearEndDate} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[
              styles.selectButton,
              scheme === 'dark' ? styles.selectButtonDark : styles.selectButtonLight
            ]}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={[
              styles.selectButtonText,
              scheme === 'dark' ? styles.selectButtonTextDark : styles.selectButtonTextLight,
              !endDate && styles.placeholderText
            ]}>
              {endDate ? formatDate(endDate) : 'No end date'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
          
          {/* End Date Picker Modal for iOS */}
          {Platform.OS === 'ios' && renderPickerModal(
            showEndDatePicker,
            () => setShowEndDatePicker(false),
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="spinner"
              onChange={onEndDateChange}
              style={styles.picker}
            />
          )}
          
          {/* Android End Date Picker */}
          {Platform.OS === 'android' && showEndDatePicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="default"
              onChange={onEndDateChange}
            />
          )}
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddSchedule}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.addButtonText}>Add to Schedule</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Medication Selection Modal */}
      <Modal
        visible={showMedicationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMedicationModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Medication</Text>
            <TouchableOpacity 
              onPress={() => setShowMedicationModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {medications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.medicationOption}
                onPress={() => {
                  setSelectedMedication(item);
                  setShowMedicationModal(false);
                }}
              >
                <Text style={styles.medicationOptionText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#6b7280" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelLight: {
    color: '#2d3748',
  },
  labelDark: {
    color: '#f7fafc',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectButtonLight: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  selectButtonDark: {
    backgroundColor: '#2d3748',
    borderColor: '#4a5568',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  selectButtonTextLight: {
    color: '#2d3748',
  },
  selectButtonTextDark: {
    color: '#f7fafc',
  },
  placeholderText: {
    opacity: 0.6,
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerContainerLight: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  pickerContainerDark: {
    backgroundColor: '#2d3748',
    borderColor: '#4a5568',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  textInputLight: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    color: '#2d3748',
  },
  textInputDark: {
    backgroundColor: '#2d3748',
    borderColor: '#4a5568',
    color: '#f7fafc',
  },
  dosageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dosageOptionSelected: {
    backgroundColor: '#e6fffa',
  },
  dosageOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  frequencyOptionSelected: {
    backgroundColor: '#e6fffa',
  },
  frequencyOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
  },
  frequencyOptionTextSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 32,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  closeButton: {
    padding: 4,
  },
  medicationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  medicationOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
  },
  // New styles for centered picker modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  picker: {
    height: 200,
    width: 300,
  },
  endDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  requiredStar: {
  color: '#ef4444', // red color
},
});