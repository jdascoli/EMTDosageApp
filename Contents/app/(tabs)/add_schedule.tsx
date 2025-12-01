import React, { useState, useEffect, useRef } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { getAllMedications, getDosagesByMedication } from '@/database/medications';
import { addMedicationSchedule, updateMedicationSchedule, checkExistingSchedule} from '@/database/schedule';
import { getCurrentUserId } from '@/lib/session';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';


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
  const params = useLocalSearchParams();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [dosages, setDosages] = useState<Dosage[]>([]);
  const [selectedDosage, setSelectedDosage] = useState<string>('');
  const [customDosage, setCustomDosage] = useState('');
  const [calculatedDosage, setCalculatedDosage] = useState('');
  const [hasCalculatedDose, setHasCalculatedDose] = useState(false);
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

  const hasInitialized = useRef(false);
  const hasSetDosageFromEdit = useRef(false);
  const isEditModeRef = useRef(isEditMode);

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    if (!selectedMedication) return;
    hasSetDosageFromEdit.current = false;
    loadDosages(selectedMedication.name);
  }, [selectedMedication]);

useEffect(() => {
    isEditModeRef.current = isEditMode;
  }, [isEditMode]);

  useEffect(() => {
    if (hasInitialized.current) return;

    console.log('Initializing AddScheduleScreen with params:', params);

    const editMode = params?.editMode === 'true';
    const scheduleId = params?.scheduleId;
    
    if (editMode && scheduleId) {
      console.log('Initializing EDIT mode with schedule ID:', scheduleId);
      setIsEditMode(true);
      setEditingScheduleId(parseInt(scheduleId as string, 10));

      if (params.medicationName) {
        setSelectedMedication({
          id: -1,
          name: params.medicationName as string,
          info: '',
          contraindications: '',
          minCert: 0
        });
      }

      if (params.dosage) setSelectedDosage(params.dosage as string);
      if (params.scheduleTime) {
        const [hours, minutes] = (params.scheduleTime as string).split(':');
        const timeDate = new Date();
        timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        setScheduleTime(timeDate);
      }
      if (params.frequency) setFrequency(params.frequency as string);
      if (params.startDate) setStartDate(new Date(params.startDate as string));
      
      hasInitialized.current = true;
    } else {
      console.log('Initializing ADD mode - fresh start');
      setIsEditMode(false);
      setEditingScheduleId(null);

      const now = new Date();
      setScheduleTime(now);
      setFrequency('daily');
      setStartDate(new Date());
      
      hasInitialized.current = true;
    }
  }, [params]);

  useEffect(() => {
    if (params.calculatedDose && params.medicationName) {
      console.log('Setting calculated dose from params:', params.calculatedDose);
      setCalculatedDosage(params.calculatedDose as string);
      setSelectedDosage(params.calculatedDose as string);
      setHasCalculatedDose(true);
      setCustomDosage(params.calculatedDose as string);
      
      setSelectedMedication({
        id: -1,
        name: params.medicationName as string,
        info: '',
        contraindications: '',
        minCert: 0
      });
    }
  }, [params.calculatedDose, params.medicationName]);


useEffect(() => {
  return () => {
    const clearDraft = async () => {
      try {
        await AsyncStorage.removeItem('@schedule_draft');
        console.log('Cleared draft on unmount');
      } catch (e) {
        console.warn('Failed to clear draft on unmount', e);
      }
    };
    clearDraft();
  };
}, []);

useEffect(() => {
  const clearExistingDraft = async () => {
    try {
      await AsyncStorage.removeItem('@schedule_draft');
      console.log('Cleared any existing schedule draft');
    } catch (e) {
      console.warn('Failed to clear existing draft', e);
    }
  };
  
  clearExistingDraft();
}, []);

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

    if (dosageData.length > 0 && !isEditModeRef.current && !hasSetDosageFromEdit.current) {
      const standardDosage = dosageData.find(d => d.usage === 'Standard') || dosageData[0];
      let autoText = '';
      if (standardDosage.fixedDose) {
        autoText = `${standardDosage.fixedDose} ${standardDosage.unit}`;
      } else if (standardDosage.perKg) {
        autoText = `${standardDosage.perKg} ${standardDosage.unit}/kg`;
      }
      if (autoText) {
        setSelectedDosage(autoText);
        hasSetDosageFromEdit.current = true;
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
      setLoading(false);
      Alert.alert('Error', 'Please log in to manage schedules');
      return;
    }

    const hh = scheduleTime.getHours().toString().padStart(2, '0');
    const mm = scheduleTime.getMinutes().toString().padStart(2, '0');
    const hhmm = `${hh}:${mm}`;

    if (!isEditMode) {
      const existingSchedule = await checkExistingSchedule(
        userId,
        selectedMedication.name,
        hhmm,
        frequency
      );

      if (existingSchedule) {
        Alert.alert(
          'Schedule Already Exists',
          `You already have a schedule for ${selectedMedication.name} at ${formatTime(scheduleTime)} ${frequency === 'daily' ? 'daily' : frequency.replace('_', ' ')}. Please edit the existing schedule instead.`,
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
    }

    if (isEditMode && editingScheduleId) {
      await updateMedicationSchedule(
        editingScheduleId,
        selectedMedication.name,
        finalDosage,
        hhmm,
        frequency,
        startDate.toISOString(),
        endDate ? endDate.toISOString() : undefined
      );
      Alert.alert('Success', 'Medication schedule updated successfully!', [
        { 
          text: 'OK', 
          onPress: () => router.replace('/(tabs)/schedule')
        }
      ]);
    } else {
      await addMedicationSchedule(
        userId,
        selectedMedication.name,
        selectedMedication.name,
        finalDosage,
        hhmm,
        frequency,
        startDate.toISOString(),
        endDate ? endDate.toISOString() : undefined
      );
      Alert.alert('Success', 'Medication schedule added successfully!', [
        { 
          text: 'OK', 
          onPress: () => router.replace('/(tabs)/schedule') 
        }
      ]);
    }
  } catch (error) {
    console.error('Error saving schedule:', error);
    Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'add'} medication schedule`);
  } finally {
    setLoading(false);
  }
};

const resetForm = () => {
  setSelectedMedication(null);
  setSelectedDosage('');
  setCustomDosage('');
  setCalculatedDosage('');
  setHasCalculatedDose(false);
  setScheduleTime(new Date());
  setFrequency('daily');
  setStartDate(new Date());
  setEndDate(null);
  
  hasInitialized.current = false;
  hasSetDosageFromEdit.current = false;
  
  Alert.alert('Form Reset', 'All fields have been cleared.');
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

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setScheduleTime(selectedTime);
    }
    
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setStartDate(selectedDate);
    }
    
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setEndDate(selectedDate);
    }
    
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={scheme === 'dark' ? '#f7fafc' : '#2d3748'} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.title}>
        {isEditMode ? 'Edit Medication Schedule' : 'Add Medication Schedule'}
        </ThemedText>
        {!isEditMode && (
          <TouchableOpacity onPress={resetForm} style={styles.resetButton}>
            <Ionicons name="refresh" size={20} color={scheme === 'dark' ? '#f7fafc' : '#2d3748'} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
        {selectedMedication && (
          <View style={styles.section}>
            <Text style={[
              styles.label,
              scheme === 'dark' ? styles.labelDark : styles.labelLight
            ]}>
              Dosage <Text style={styles.requiredStar}>*</Text>
            </Text>
            {!hasCalculatedDose && (
            <TouchableOpacity 
                style={[
                  styles.calculateButton,
                  scheme === 'dark' ? styles.calculateButtonDark : styles.calculateButtonLight
                ]}
                onPress={() => router.push(`/medication/${selectedMedication.name}?fromSchedule=true`)}
              >
                <Ionicons name="calculator-outline" size={20} color="#3b82f6" />
                <Text style={styles.calculateButtonText}>Calculate Correct Dosage</Text>
            </TouchableOpacity>
            )}
    {hasCalculatedDose && calculatedDosage && (
      <View style={styles.calculatedDosageContainer}>
        <TouchableOpacity
          style={[
            styles.calculatedDosageOption,
            styles.calculatedDosageOptionSelected
          ]}
          onPress={() => {
            setSelectedDosage(calculatedDosage);
            setCustomDosage(calculatedDosage);
          }}
        >
          <View style={styles.calculatedDosageContent}>
            <View style={styles.calculatedDosageTextContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.calculatedDosageText}>{calculatedDosage}</Text>
            </View>
            <TouchableOpacity 
              style={styles.recalculateButton}
              onPress={() => router.push(`/medication/${selectedMedication.name}?fromSchedule=true`)}
            >
              <Ionicons name="create-outline" size={16} color="#6b7280" />
              <Text style={styles.recalculateButtonText}>Recalculate</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    )}

    {!hasCalculatedDose && dosages.length > 0 && (
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
    )}

    {!hasCalculatedDose && dosages.length === 0 && (
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
          {Platform.OS === 'android' && showTimePicker && (
            <DateTimePicker
              value={scheduleTime}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}
        </View>
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
          {Platform.OS === 'android' && showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={onStartDateChange}
            />
          )}
        </View>

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
          
          {Platform.OS === 'android' && showEndDatePicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="default"
              onChange={onEndDateChange}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddSchedule}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name={isEditMode ? "checkmark-circle" : "add-circle"} size={20} color="white" />
              <Text style={styles.addButtonText}>
                {isEditMode ? 'Update Schedule' : 'Add to Schedule'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

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
  color: '#ef4444', 
},
calculateButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 12,
  borderRadius: 8,
  borderWidth: 1,
  marginBottom: 12,
  gap: 8,
},
calculateButtonLight: {
  backgroundColor: '#f0f9ff',
  borderColor: '#bae6fd',
},
calculateButtonDark: {
  backgroundColor: '#1e3a8a',
  borderColor: '#3b82f6',
},
calculateButtonText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#3b82f6',
},
dosageTextContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
calculatedBadge: {
  fontSize: 12,
  fontWeight: '600',
  color: '#3b82f6',
  backgroundColor: '#dbeafe',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
},
calculatedDosageContainer: {
  marginBottom: 12,
},
calculatedDosageOption: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 16,
  borderRadius: 12,
  borderWidth: 2,
},
calculatedDosageOptionSelected: {
  backgroundColor: '#e6fffa',
  borderColor: '#10b981',
},
calculatedDosageContent: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
calculatedDosageTextContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  flex: 1,
},
calculatedDosageText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#065f46',
},
recalculateButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  padding: 6,
  borderRadius: 6,
  backgroundColor: '#f8f9fa',
},
recalculateButtonText: {
  fontSize: 12,
  fontWeight: '500',
  color: '#6b7280',
},
resetButton: {
  padding: 8,
  marginLeft: 8,
},
});