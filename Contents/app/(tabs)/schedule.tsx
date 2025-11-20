import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, useColorScheme, ActivityIndicator, } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { getUserSchedules, markScheduleAsTaken, deactivateSchedule, undoMarkAsTaken } from '@/database/schedule';
import { getCurrentUserId } from '@/lib/session';
import { router, useFocusEffect } from 'expo-router';

interface ScheduleItem {
  id: number;
  medicationId: string;
  medicationName: string;
  dosage: string;
  schedule_time: string;
  frequency: string;
  start_date: string;
  current_status: 'scheduled' | 'taken' | 'missed';
  last_taken?: string;
}

export default function ScheduleScreen() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scheme = useColorScheme();
  const schedulesRef = useRef<ScheduleItem[]>([]);

  useEffect(() => {
    loadUserSchedules();
  }, []);

  // Real-time clock updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused - refreshing schedules');
      loadUserSchedules();
    }, [])
  );

  // FIXED: Smart status updates with minute-range time comparison
  useEffect(() => {
    const updateScheduleStatuses = () => {
      setSchedules(prevSchedules => {
        const updatedSchedules = prevSchedules.map(schedule => {
          if (schedule.current_status === 'taken') return schedule;

          const scheduleDate = new Date(schedule.start_date);
          const [hours, minutes] = schedule.schedule_time.split(':').map(Number);
          const scheduledStart = new Date(scheduleDate);
          scheduledStart.setHours(hours, minutes, 0, 0);
          const scheduledEnd = new Date(scheduledStart.getTime() + 59_999); // end of that minute

          // Determine status using minute-range logic
          let correctStatus: 'scheduled' | 'missed' = 'scheduled';

          if (currentTime.getTime() > scheduledEnd.getTime()) {
            correctStatus = 'missed';
          } else {
            // still within or before the scheduled minute -> keep as scheduled (we'll display "Due Now" separately)
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

    // Update immediately when component mounts or currentTime changes
    updateScheduleStatuses();

    // Set up interval for continuous updates
    const interval = setInterval(updateScheduleStatuses, 1000); // Check every second for exact timing

    return () => clearInterval(interval);
  }, [currentTime]);

  // Update the ref when schedules change
  useEffect(() => {
    schedulesRef.current = schedules;
  }, [schedules]);

  const loadUserSchedules = async () => {
    try {
      setLoading(true);
      const currentUserId = await getCurrentUserId();
      
      if (!currentUserId) {
        Alert.alert('Authentication Required', 'Please log in to view your medication schedule');
        setSchedules([]);
        setLoading(false);
        return;
      }

      const userSchedules = await getUserSchedules(currentUserId);
      
      // FIXED: Process schedules with minute-range time comparison on load
      const processedSchedules = (userSchedules as ScheduleItem[]).map(schedule => {
        if (schedule.current_status === 'taken') return schedule;

        const scheduleDate = new Date(schedule.start_date);
        const [hours, minutes] = schedule.schedule_time.split(':').map(Number);
        const scheduledStart = new Date(scheduleDate);
        scheduledStart.setHours(hours, minutes, 0, 0);
        const scheduledEnd = new Date(scheduledStart.getTime() + 59_999);

        let correctStatus: 'scheduled' | 'missed' = 'scheduled';
        if (currentTime.getTime() > scheduledEnd.getTime()) {
          correctStatus = 'missed';
        }

        return { ...schedule, current_status: correctStatus };
      });

      setSchedules(processedSchedules);
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

  const handleMarkAsTaken = async (scheduleId: number, medicationName: string) => {
    try {
      await markScheduleAsTaken(scheduleId, `Taken on ${new Date().toLocaleString()}`);
      
      // Update local state
      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, current_status: 'taken', last_taken: new Date().toISOString() }
          : schedule
      ));
      
      Alert.alert('Medication Recorded', `${medicationName} has been marked as taken.`);
    } catch (error) {
      console.error('Error marking as taken:', error);
      Alert.alert('Error', 'Failed to update medication status');
    }
  };

  const handleUndoTaken = async (scheduleId: number, medicationName: string) => {
    try {
      await undoMarkAsTaken(scheduleId);
      
      // FIXED: Proper status recalculation when undoing with minute-range logic
      setSchedules(prev => prev.map(schedule => {
        if (schedule.id === scheduleId) {
          const scheduleDate = new Date(schedule.start_date);
          const [hours, minutes] = schedule.schedule_time.split(':').map(Number);
          const scheduledStart = new Date(scheduleDate);
          scheduledStart.setHours(hours, minutes, 0, 0);
          const scheduledEnd = new Date(scheduledStart.getTime() + 59_999);
          
          let correctStatus: 'scheduled' | 'missed' = 'scheduled';
          if (currentTime.getTime() > scheduledEnd.getTime()) {
            correctStatus = 'missed';
          }
          
          return { ...schedule, current_status: correctStatus, last_taken: undefined };
        }
        return schedule;
      }));
      
      Alert.alert('Status Updated', `${medicationName} has been marked as scheduled again.`);
    } catch (error) {
      console.error('Error undoing taken status:', error);
      Alert.alert('Error', 'Failed to update medication status');
    }
  };

  const handleDeleteSchedule = async (scheduleId: number, medicationName: string) => {
    Alert.alert(
      'Delete Medication Schedule',
      `Are you sure you want to delete the schedule for ${medicationName}?`,
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
              await deactivateSchedule(scheduleId);
              
              // Remove from local state
              setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
              
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

  const formatTimeForDisplay = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  // FIXED: Helper function to check if current time is within the scheduled minute
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

  // FIXED: Updated getStatusColor with minute-range logic
  const getStatusColor = (status: string, scheduleTime?: string, startDate?: string) => {
    switch (status) {
      case 'taken': return '#10b981'; 
      case 'missed': return '#ef4444'; 
      case 'scheduled': 
        if (isDueNow(scheduleTime, startDate)) return '#f59e0b'; // Due Now
        return '#3b82f6'; // Upcoming
      default: return '#3b82f6';
    }
  };

  // FIXED: Updated getStatusText with minute-range logic
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

  const groupSchedulesByDate = () => {
    const grouped = schedules.reduce((acc, schedule) => {
      const date = new Date(schedule.start_date).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(schedule);
      return acc;
    }, {} as Record<string, ScheduleItem[]>);

    const today = new Date().toDateString();

    return Object.entries(grouped)
      .map(([date, data]) => {
        const scheduleDate = new Date(date);
        const isToday = date === today;

        const title = isToday
        ? `Today • ${scheduleDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`

      : scheduleDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });

      return {
        title,
        data,
        date: scheduleDate,
        isToday
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
          <Text style={styles.lastTakenText}>
            Taken at {new Date(item.last_taken).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
      
      <View style={styles.actionsContainer}>
        {item.current_status === 'scheduled' && (
          <TouchableOpacity 
            style={styles.takenButton}
            onPress={() => handleMarkAsTaken(item.id, item.medicationName)}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
            <Text style={styles.takenButtonText}>Mark Taken</Text>
          </TouchableOpacity>
        )}
        
        {item.current_status === 'taken' && (
          <TouchableOpacity 
            style={styles.undoButton}
            onPress={() => handleUndoTaken(item.id, item.medicationName)}
          >
            <Ionicons name="arrow-undo" size={24} color="#f59e0b" />
            <Text style={styles.undoButtonText}>Undo</Text>
          </TouchableOpacity>
        )}

        {item.current_status === 'missed' && (
          <View style={styles.missedIndicator}>
            <Ionicons name="close-circle" size={24} color="#ef4444" />
            <Text style={styles.missedIndicatorText}>Missed</Text>
          </View>
        )}

        {/* Delete button */}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteSchedule(item.id, item.medicationName)}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
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

      {/* the Add Schedule button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity 
          style={styles.addScheduleButton}
          onPress={() => router.push('/(tabs)/add_schedule')}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addScheduleButtonText}>Add Medication Schedule</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
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

      {/* Show schedules if they exist, otherwise show empty state */}
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
    alignItems: 'center',
    minWidth: 100,
  },
  takenButton: {
    alignItems: 'center',
    padding: 6,
    marginBottom: 4,
  },
  takenButtonText: {
    fontSize: 9,
    color: '#10b981',
    marginTop: 2,
    fontWeight: '600',
  },
  undoButton: {
    alignItems: 'center',
    padding: 6,
    marginBottom: 4,
  },
  undoButtonText: {
    fontSize: 9,
    color: '#f59e0b',
    marginTop: 2,
    fontWeight: '600',
  },
  missedIndicator: {
    alignItems: 'center',
    padding: 6,
    marginBottom: 4,
  },
  missedIndicatorText: {
    fontSize: 9,
    color: '#ef4444',
    marginTop: 2,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
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
});