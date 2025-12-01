import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, useColorScheme, ActivityIndicator, Modal } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { getUserSchedules, markScheduleAsTaken, deactivateSchedule, undoMarkAsTaken, updateTakenTime, getUserSchedulesForDateRange } from '@/database/schedule';
import { getCurrentUserId } from '@/lib/session';
import { router, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ScheduleItem {
  id: number;
  medicationId: string;
  medicationName: string;
  dosage: string;
  schedule_time: string;
  frequency: string;
  start_date: string;
  end_date?: string; 
  current_status: 'scheduled' | 'taken' | 'missed';
  last_taken?: string;
}

export default function ScheduleScreen() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const scheme = useColorScheme();
  const schedulesRef = useRef<ScheduleItem[]>([]);
  const authAlertShownRef = useRef(false);
  const [editingScheduledDate, setEditingScheduledDate] = useState<string | null>(null);

  useEffect(() => {
    loadUserSchedules();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused - refreshing schedules');
      loadUserSchedules();
    }, [])
  );

  useEffect(() => {
    const updateScheduleStatuses = () => {
      setSchedules(prevSchedules => {
        const updatedSchedules = prevSchedules.map(schedule => {
          if (schedule.current_status === 'taken') return schedule;

          const scheduleDate = new Date(schedule.start_date);
          const [hours, minutes] = schedule.schedule_time.split(':').map(Number);
          const scheduledStart = new Date(scheduleDate);
          scheduledStart.setHours(hours, minutes, 0, 0);
          const scheduledEnd = new Date(scheduledStart.getTime() + 59_999);

          let correctStatus: 'scheduled' | 'missed' = 'scheduled';

          if (currentTime.getTime() > scheduledEnd.getTime()) {
            correctStatus = 'missed';
          } else {
            correctStatus = 'scheduled';
          }

          if (schedule.current_status !== correctStatus) {
            console.log(`🔄 Auto-update: ${schedule.medicationName} from ${schedule.current_status} to ${correctStatus}`);
            return { ...schedule, current_status: correctStatus };
          }
          return schedule;
        });

        const hasChanges = JSON.stringify(prevSchedules) !== JSON.stringify(updatedSchedules);
        return hasChanges ? updatedSchedules : prevSchedules;
      });
    };

    updateScheduleStatuses();

    const interval = setInterval(updateScheduleStatuses, 1000); 

    return () => clearInterval(interval);
  }, [currentTime]);

  useEffect(() => {
    schedulesRef.current = schedules;
  }, [schedules]);

  useEffect(() => {
  return () => {
    authAlertShownRef.current = false;
  };
}, []);

const loadUserSchedules = async () => {
  try {
    setLoading(true);
    const currentUserId = await getCurrentUserId();
    
    if (!currentUserId) {
      if (!authAlertShownRef.current) {
        authAlertShownRef.current = true;
        Alert.alert(
          'Authentication Required', 
          'Please log in to view your medication schedule',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login')
            }
          ]
        );
      }
      setSchedules([]);
      setLoading(false);
      return;
    }
    authAlertShownRef.current = false;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); 
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 4); 
    endDate.setHours(23, 59, 59, 999); 

    console.log('DEBUG: Date range for schedules:', {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      range: 'Today + next 4 days (5 days total)'
    });

    const userSchedules = await getUserSchedulesForDateRange(
      currentUserId as number,
      startDate.toISOString().split('T')[0], 
      endDate.toISOString().split('T')[0]
    );
    
    setSchedules(userSchedules as ScheduleItem[]);
  } catch (error) {
    console.error('Error loading schedules:', error);
    Alert.alert('Error', 'Failed to load your medication schedule');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserSchedules();
  };

const handleToggleTaken = async (uniqueId: number, scheduledDate: string, medicationName: string, currentStatus: 'scheduled' | 'taken' | 'missed') => {
  try {
    const originalScheduleId = getOriginalScheduleId(uniqueId);
    
    if (currentStatus === 'taken') {
      await undoMarkAsTaken(originalScheduleId, scheduledDate);
      
      setSchedules(prev => prev.map(schedule => {
        if (schedule.id === uniqueId) {
          return { ...schedule, current_status: 'missed', last_taken: undefined };
        }
        return schedule;
      }));
      
      Alert.alert('Status Updated', `${medicationName} has been marked as not taken.`);
    } else {
      await markScheduleAsTaken(originalScheduleId, scheduledDate, `Taken on ${new Date().toLocaleString()}`);
      
      setSchedules(prev => prev.map(schedule => 
        schedule.id === uniqueId
          ? { ...schedule, current_status: 'taken', last_taken: new Date().toISOString() }
          : schedule
      ));
      
      const action = currentStatus === 'missed' ? 'marked as taken (was missed)' : 'marked as taken';
      Alert.alert('Medication Recorded', `${medicationName} has been ${action}.`);
    }
  } catch (error) {
    console.error('Error toggling taken status:', error);
    Alert.alert('Error', 'Failed to update medication status');
  }
};


const handleTimeSave = async () => {
  setShowTimeModal(false);
  setEditingScheduleId(null);
};

const handleTimeChange = async (selectedDate?: Date) => {
  if (selectedDate && editingScheduleId && editingScheduledDate) {
    const isoTime = selectedDate.toISOString();
    const originalScheduleId = getOriginalScheduleId(editingScheduleId);
    
    try {
      await updateTakenTime(originalScheduleId, editingScheduledDate, isoTime);
      
      setSchedules(prev => prev.map(schedule => 
        schedule.id === editingScheduleId
          ? { ...schedule, last_taken: isoTime }
          : schedule
      ));
      
      console.log('Time updated successfully:', isoTime);
    } catch (error) {
      console.error('Error updating time:', error);
      Alert.alert('Error', 'Failed to update taken time');
    }
  }
};

const handleDeleteSchedule = async (uniqueId: number, medicationName: string) => {
  const originalScheduleId = getOriginalScheduleId(uniqueId);
  
  Alert.alert(
    'Delete Medication Schedule',
    `Are you sure you want to delete ALL schedule entries for ${medicationName}?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deactivateSchedule(originalScheduleId);
            
            setSchedules(prev => prev.filter(schedule => 
              getOriginalScheduleId(schedule.id) !== originalScheduleId
            ));
            
            Alert.alert('Deleted', `${medicationName} schedule has been deleted.`);
          } catch (error) {
            console.error('Error deleting schedule:', error);
            Alert.alert('Error', 'Failed to delete medication schedule');
          }
        },
      },
    ]
  );
};

const getOriginalScheduleId = (uniqueId: number): number => {
  const idStr = uniqueId.toString();
  const match = idStr.match(/^(\d+)\d{8}\d{4}$/);
  return match ? parseInt(match[1]) : uniqueId;
};

const handleEditSchedule = (schedule: ScheduleItem) => {
  const originalScheduleId = getOriginalScheduleId(schedule.id);
  
  router.push({
    pathname: '/(tabs)/add_schedule',
    params: { 
      editMode: 'true',
      scheduleId: originalScheduleId.toString(),
      medicationName: schedule.medicationName,
      dosage: schedule.dosage,
      scheduleTime: schedule.schedule_time,
      frequency: schedule.frequency,
      startDate: schedule.start_date
    }
  });
};

const formatTimeForDisplay = (time24: string) => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
};

const isDueNow = (scheduleTime?: string, startDate?: string) => {
  if (!scheduleTime || !startDate) return false;
  const scheduleDate = new Date(startDate);
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  const scheduledStart = new Date(scheduleDate);
  scheduledStart.setHours(hours, minutes, 0, 0);
  const scheduledEnd = new Date(scheduledStart.getTime() + 59_999);

  const now = new Date();
  return now.getTime() >= scheduledStart.getTime() && now.getTime() <= scheduledEnd.getTime();
};

const getStatusColor = (status: string, scheduleTime?: string, startDate?: string) => {
  switch (status) {
    case 'taken': return '#10b981'; 
    case 'missed': return '#ef4444'; 
    case 'scheduled': 
      if (isDueNow(scheduleTime, startDate)) return '#f59e0b'; 
      return '#3b82f6'; 
    default: return '#3b82f6';
  }
};

const getStatusText = (status: string, scheduleTime?: string, startDate?: string) => {
  switch (status) {
    case 'taken': return 'Taken';
    case 'missed': return 'Missed';
    case 'scheduled': 
      if (isDueNow(scheduleTime, startDate)) return 'Due Now';
      return 'Upcoming';
    default: return 'Upcoming';
  }
};

const getButtonText = (status: string) => {
  switch (status) {
    case 'taken': return 'Taken';
    case 'missed': return 'Missed';
    case 'scheduled': return 'Mark Taken';
    default: return 'Mark Taken';
  }
};

const groupSchedulesByDate = () => {
  const grouped = schedules.reduce((acc, schedule) => {
    const dateKey = new Date(schedule.start_date).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(schedule);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  return Object.entries(grouped)
    .map(([dateKey, data]) => {
      const scheduleDate = new Date(dateKey);
      const isToday = dateKey === today;
      const isYesterday = dateKey === yesterdayStr;

      let title = '';
      if (isYesterday) {
        title = `Yesterday • ${scheduleDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`;
      } else if (isToday) {
        title = `Today • ${scheduleDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`;
      } else {
        title = scheduleDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }

      return {
        title,
        data,
        date: scheduleDate,
        isToday,
        isYesterday
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

  const renderScheduleItem = ({ item }: { item: ScheduleItem }) => (
    <View style={[
      styles.scheduleItem,
      scheme === 'dark' ? styles.scheduleItemDark : styles.scheduleItemLight
    ]}>
      <View style={styles.timeContainer}>
        <Text style={[
          styles.timeText,
          scheme === 'dark' ? styles.timeTextDark : styles.timeTextLight
        ]}>
          {formatTimeForDisplay(item.schedule_time)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.current_status, item.schedule_time, item.start_date) }]}>
          <Text style={styles.statusBadgeText}>{getStatusText(item.current_status, item.schedule_time, item.start_date)}</Text>
        </View>
      </View>
      
      <View style={styles.medicationInfo}>
        <Text style={[
          styles.medicationName,
          scheme === 'dark' ? styles.medicationNameDark : styles.medicationNameLight
        ]}>
          {item.medicationName}
        </Text>
        <Text style={styles.dosageText}>{item.dosage}</Text>
        <Text style={styles.frequencyText}>{item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)}</Text>
        {item.last_taken && (
          <View style={styles.takenTimeContainer}>
          <Text style={styles.lastTakenText}>
            Taken at {new Date(item.last_taken).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <TouchableOpacity
          style={styles.editTimeButton}
        onPress={() => {
          setEditingScheduleId(item.id);
          setEditingScheduledDate(item.start_date);
          setShowTimeModal(true);
        }}
      >
        <Ionicons name="create-outline" size={12} color="#6b7280" />
      </TouchableOpacity>
      </View>
        )}
        </View>
      <View style={styles.actionsContainer}>
  <View style={styles.statusActions}>
    {(item.current_status === 'scheduled' || item.current_status === 'missed' || item.current_status === 'taken') && (
      <TouchableOpacity 
        style={styles.takenButton}
        onPress={() => handleToggleTaken(item.id, item.start_date, item.medicationName, item.current_status)}
      >
        <Ionicons 
          name={
            item.current_status === 'taken' ? "checkmark-circle" : 
            item.current_status === 'missed' ? "close-circle" : "checkmark-circle-outline"} 
          size={24} 
          color={
            item.current_status === 'taken' ? '#10b981' :
            item.current_status === 'missed' ? '#ef4444': '#10b981'} 
        />
        <Text style={
          item.current_status === 'missed' ? styles.missedButtonText : styles.takenButtonText
          }>
            {getButtonText(item.current_status)}
            </Text>
      </TouchableOpacity>
    )}
  </View>
  <View style={styles.rightActions}>
    <TouchableOpacity 
      style={styles.editButton}
      onPress={() => handleEditSchedule(item)}
    >
      <Ionicons name="create-outline" size={20} color="#3b82f6" />
    </TouchableOpacity>

    <TouchableOpacity 
      style={styles.deleteButton}
      onPress={() => handleDeleteSchedule(item.id, item.medicationName)}
    >
      <Ionicons name="trash-outline" size={20} color="#ef4444" />
    </TouchableOpacity>
  </View>
</View>
</View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <ThemedText style={styles.loadingText}>Loading your medication schedule...</ThemedText>
      </ThemedView>
    );
  }

  const scheduleSections = groupSchedulesByDate();
  const totalScheduled = schedules.filter(s => s.current_status === 'scheduled').length;
  const totalTaken = schedules.filter(s => s.current_status === 'taken').length;
  const totalMissed = schedules.filter(s => s.current_status === 'missed').length;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Medication Schedule
        </ThemedText>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={scheme === 'dark' ? '#f7fafc' : '#2d3748'} />
        </TouchableOpacity>
      </View>
      
      <ThemedText type="default" style={styles.subtitle}>
        Today • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </ThemedText>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity 
          style={styles.addScheduleButton}
          onPress={() => router.push('/(tabs)/add_schedule')}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addScheduleButtonText}>Add Medication Schedule</Text>
        </TouchableOpacity>
      </View>

      {schedules.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalScheduled}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalTaken}</Text>
            <Text style={styles.statLabel}>Taken</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalMissed}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{schedules.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      )}

      {schedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="medical-outline" size={64} color="#6b7280" />
          <Text style={[
            styles.emptyStateText,
            scheme === 'dark' ? styles.emptyStateTextDark : styles.emptyStateTextLight
          ]}>
            No medications scheduled yet
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Get started by adding your first medication schedule
          </Text>
        </View>
      ) : (
        <FlatList
          data={scheduleSections}
          keyExtractor={(section) => section.title}
          renderItem={({ item: section }) => (
            <View style={styles.section}>
              <Text style={[
                styles.sectionTitle,
                section.isToday ? styles.todaySectionTitle : {},
                scheme === 'dark' ? styles.sectionTitleDark : styles.sectionTitleLight
              ]}>
                {section.title} ({section.data.length})
              </Text>
              {section.data.map((schedule) => (
                <View key={schedule.id}>
                  {renderScheduleItem({ item: schedule })}
                </View>
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleTimeSave}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={handleTimeSave}
        >
          <View style={styles.timeModal}>
            <Text style={styles.modalTitle}>Select Taken Time</Text>
            <DateTimePicker
              value={editingScheduleId ? new Date(schedules.find(s => s.id === editingScheduleId)?.last_taken || new Date()) : new Date()}
              mode="time"
              display="spinner"
              onChange={(event: any, selectedDate?: Date) => {
                if (event.type === 'set' && selectedDate) {
                  handleTimeChange(selectedDate);
                }
              }}
            />
          </View>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  subtitle: {
    marginBottom: 16,
    opacity: 0.7,
  },
  addButtonContainer: {
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  sectionTitleLight: {
    color: '#2d3748',
  },
  sectionTitleDark: {
    color: '#f7fafc',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  scheduleItemLight: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  scheduleItemDark: {
    backgroundColor: '#2d3748',
    borderColor: '#4a5568',
  },
  timeContainer: {
    width: 80,
    marginRight: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeTextLight: {
    color: '#2d3748',
  },
  timeTextDark: {
    color: '#f7fafc',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
  },
  medicationInfo: {
    flex: 1,
    marginRight: 12,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  medicationNameLight: {
    color: '#2d3748',
  },
  medicationNameDark: {
    color: '#f7fafc',
  },
  dosageText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
    marginBottom: 2,
  },
  dosageTextLight: {
    color: '#2d3748',
  },
  dosageTextDark: {
    color: '#f7fafc',
  },
  frequencyText: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  frequencyTextLight: {
    color: '#2d3748',
  },
  frequencyTextDark: {
    color: '#f7fafc',
  },
  lastTakenText: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 2,
  },
  lastTakenTextLight: {
    color: '#2d3748',
  },
  lastTakenTextDark: {
    color: '#f7fafc',
  },
actionsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  minWidth: 160,
},
statusActions: {
  alignItems: 'center',
},
rightActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
takenButton: {
  alignItems: 'center',
  padding: 6,
},
takenButtonText: {
  fontSize: 9,
  color: '#10b981',
  marginTop: 2,
  fontWeight: '600',
},
editButton: {
  padding: 8,
  backgroundColor: '#eff6ff',
  borderRadius: 6,
  borderWidth: 1,
  borderColor: '#dbeafe',
},
deleteButton: {
  padding: 8,
  backgroundColor: '#fef2f2',
  borderRadius: 6,
  borderWidth: 1,
  borderColor: '#fecaca',
},
missedButtonText: {
  fontSize: 9,
  color: '#ef4444', 
  marginTop: 2,
  fontWeight: '600',
},
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateTextLight: {
    color: '#2d3748',
  },
  emptyStateTextDark: {
    color: '#f7fafc',
  },
  emptyStateSubtext: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
    marginBottom: 24,
  },
  emptyStateSubtextLight: {
    color: '#2d3748',
  },
  emptyStateSubtextDark: {
    color: '#f7fafc',
  },
  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addScheduleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  todaySectionTitle: {
  color: '#3b82f6', 
  fontWeight: '700', 
},
takenTimeContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 0,
},
editTimeButton: {
  padding: 0,
  marginLeft: -10,
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
timePicker: {
  width: '100%',
  backgroundColor: 'white',
},
timeModal: {
  backgroundColor: 'white',
  padding: 20,
  borderRadius: 12,
  width: '80%',
  alignItems: 'center',
},
modalTitle: {
  fontSize: 18,
  fontWeight: '600',
  marginBottom: 16,
  color: '#1f2937',
},
});