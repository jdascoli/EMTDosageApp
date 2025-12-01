import db from "./medications";

interface Schedule {
  id: number;
  userId: number;
  medicationId: string;
  medicationName: string;
  dosage: string;
  schedule_time: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  is_active: number;
  created_at: string;
  last_taken?: string;
}

interface ScheduleHistory {
  id: number;
  scheduleId: number;
  scheduled_date: string;
  taken_at: string | null;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  notes?: string;
}

interface ScheduleWithStatus extends Schedule {
  current_status: 'scheduled' | 'taken' | 'missed';
}

export const initializeSchedules = async (): Promise<void> => {
  await db.execAsync(`PRAGMA foreign_keys = ON;`);
  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS medication_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      medicationId TEXT NOT NULL,
      medicationName TEXT NOT NULL,
      dosage TEXT NOT NULL,
      schedule_time TEXT NOT NULL,
      frequency TEXT DEFAULT 'daily',
      start_date TEXT NOT NULL,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (medicationId) REFERENCES medications(name) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schedule_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheduleId INTEGER NOT NULL,
      scheduled_date TEXT NOT NULL,
      taken_at TEXT,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      FOREIGN KEY (scheduleId) REFERENCES medication_schedules(id) ON DELETE CASCADE
    );
  `);

  try {
    const oldTableInfo = await db.getAllAsync(`PRAGMA table_info(schedule_history)`);
    const hasScheduledDate = oldTableInfo.some((col: any) => col.name === 'scheduled_date');
    
    if (!hasScheduledDate) {
      console.log('Migrating schedule_history table to new schema...');
      
      await db.execAsync(`
        CREATE TABLE schedule_history_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          scheduleId INTEGER NOT NULL,
          scheduled_date TEXT NOT NULL,
          taken_at TEXT,
          status TEXT DEFAULT 'scheduled',
          notes TEXT,
          FOREIGN KEY (scheduleId) REFERENCES medication_schedules(id) ON DELETE CASCADE
        );
      `);
      
      await db.execAsync(`
        INSERT INTO schedule_history_new (scheduleId, scheduled_date, taken_at, status, notes)
        SELECT 
          scheduleId,
          date(taken_at) as scheduled_date,
          CASE WHEN status = 'taken' THEN taken_at ELSE NULL END as taken_at,
          status,
          notes
        FROM schedule_history
      `);
      
      await db.execAsync(`DROP TABLE schedule_history;`);
      await db.execAsync(`ALTER TABLE schedule_history_new RENAME TO schedule_history;`);
      
      console.log('Database migration completed successfully');
    }
  } catch (error) {
    console.log('No migration needed or migration failed:', error);
  }
};

export const checkExistingSchedule = async (
  userId: number,
  medicationName: string,
  scheduleTime: string,
  frequency: string
): Promise<boolean> => {
  try {
    const existingSchedule = await db.getFirstAsync(
      `SELECT id FROM medication_schedules 
       WHERE userId = ? AND medicationName = ? AND schedule_time = ? AND frequency = ? AND is_active = 1`,
      [userId, medicationName, scheduleTime, frequency]
    );
    
    return !!existingSchedule;
  } catch (error) {
    console.error('Error checking existing schedule:', error);
    return false;
  }
};

export const addMedicationSchedule = async (
  userId: number,
  medicationId: string,
  medicationName: string,
  dosage: string,
  scheduleTime: string,
  frequency: string = 'daily',
  startDate: string,
  endDate?: string
): Promise<any> => {
  const result = await db.runAsync(
    `INSERT INTO medication_schedules 
     (userId, medicationId, medicationName, dosage, schedule_time, frequency, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, medicationId, medicationName, dosage, scheduleTime, frequency, startDate, endDate || null]
  );
  
  if (result.lastInsertRowId) {
    const scheduleId = result.lastInsertRowId;
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const scheduleStartDate = new Date(startDate.split('T')[0]);
      if (!endDate || new Date(dateStr) <= new Date(endDate)) {
        if (new Date(dateStr) >= scheduleStartDate) {
          try {
            await db.runAsync(
              `INSERT OR IGNORE INTO schedule_history 
               (scheduleId, scheduled_date, status)
               VALUES (?, ?, 'scheduled')`,
              [scheduleId, dateStr]
            );
          } catch (error) {
            console.warn('Error creating history entry:', error);
          }
        }
      }
    }
  }
  
  return result;
};

export const getUserSchedules = async (userId: number): Promise<ScheduleWithStatus[]> => {
  const schedules: Schedule[] = await db.getAllAsync<Schedule>(
    `SELECT ms.*, sh.taken_at as last_taken
     FROM medication_schedules ms
     LEFT JOIN (
       SELECT scheduleId, MAX(taken_at) as taken_at 
       FROM schedule_history 
       WHERE status = 'taken'
       GROUP BY scheduleId
     ) sh ON ms.id = sh.scheduleId
     WHERE ms.userId = ? AND ms.is_active = 1
     
     ORDER BY ms.start_date, ms.schedule_time`,
    [userId]
  );

  const now: Date = new Date();
  
  const schedulesWithStatus: ScheduleWithStatus[] = schedules.map((schedule: Schedule): ScheduleWithStatus => {
    if (schedule.last_taken) {
      return { 
        ...schedule, 
        current_status: 'taken' as const 
      };
    }
    const scheduleDate: Date = new Date(schedule.start_date);
    const [hours, minutes]: number[] = schedule.schedule_time.split(':').map(Number);
    const scheduledDateTime: Date = new Date(scheduleDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    if (now < scheduledDateTime) {
      return { 
        ...schedule, 
        current_status: 'scheduled' as const 
      };
    }

    const bufferTime = 1 * 60 * 1000;
    const missedThreshold = new Date(scheduledDateTime.getTime() + bufferTime);

    if (now > missedThreshold) {
      return { 
        ...schedule, 
        current_status: 'missed' as const 
      };
    } 
    
    return { 
      ...schedule, 
      current_status: 'scheduled' as const 
    };
  });

  console.log('DEBUG SCHEDULES:', {
    currentTime: now.toISOString(),
    totalSchedules: schedulesWithStatus.length,
    schedules: schedulesWithStatus.map((s: ScheduleWithStatus) => ({
      id: s.id,
      name: s.medicationName,
      scheduledDate: s.start_date,
      scheduledTime: s.schedule_time,
      status: s.current_status,
      last_taken: s.last_taken
    }))
  });
  
  return schedulesWithStatus;
};

export const getUserSchedulesForDateRange = async (userId: number, startDate: string, endDate: string): Promise<ScheduleWithStatus[]> => {
  console.log('DEBUG: getUserSchedulesForDateRange called with', { userId, startDate, endDate });
  
  const schedules: Schedule[] = await db.getAllAsync<Schedule>(
    `SELECT ms.*
     FROM medication_schedules ms
     WHERE ms.userId = ? AND ms.is_active = 1
     ORDER BY ms.start_date, ms.schedule_time`,
    [userId]
  );

  console.log('DEBUG: Found schedules from database:', schedules);

  const now: Date = new Date();
  const result: ScheduleWithStatus[] = [];

  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  for (let i = 0; i <= 4; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date);
    console.log('DEBUG: Generated date', date.toISOString().split('T')[0]);
  }

  const normalizeToStartOfDay = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const extractDatePart = (dateString: string): string => {
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  };

  const createStartDateTime = (schedule: Schedule): Date => {
  try {
    const datePart = extractDatePart(schedule.start_date);

    const [hours, minutes] = schedule.schedule_time.split(':').map(Number);
    
    const startDateTime = new Date(datePart + 'T00:00:00');
    startDateTime.setHours(hours, minutes, 0, 0);
    
    console.log('DEBUG: createStartDateTime', {
      medication: schedule.medicationName,
      originalStartDate: schedule.start_date,
      extractedDatePart: datePart,
      scheduleTime: schedule.schedule_time,
      result: startDateTime.toISOString()
    });
    
    return startDateTime;
  } catch (error) {
    console.error('ERROR creating startDateTime:', error);
    const fallback = new Date();
    return fallback;
  }
};

   const shouldIncludeDate = (schedule: Schedule, currentDate: Date): boolean => {
   const scheduleStartDate = extractDatePart(schedule.start_date);
   const scheduleStart = new Date(scheduleStartDate + 'T00:00:00');
  
   const checkDate = normalizeToStartOfDay(currentDate);
  
   if (checkDate < scheduleStart) {
    console.log('DEBUG: Skipping date - before schedule start', { 
      checkDate: checkDate.toISOString(), 
      scheduleStart: scheduleStart.toISOString() 
    });
    return false;
  }
  
   if (schedule.end_date) {
    const scheduleEndDate = extractDatePart(schedule.end_date);
    const scheduleEnd = new Date(scheduleEndDate + 'T23:59:59.999');
    const checkDateEnd = new Date(checkDate);
    checkDateEnd.setHours(23, 59, 59, 999);
    
    if (checkDateEnd > scheduleEnd) {
      console.log('DEBUG: Skipping date - after schedule end', { 
        checkDate: checkDateEnd.toISOString(), 
        scheduleEnd: scheduleEnd.toISOString() 
      });
      return false;
    }
  }

  const dayOfWeek = checkDate.getDay(); 
  const dayOfMonth = checkDate.getDate();
  
  switch (schedule.frequency) {
    case 'daily':
    case 'twice_daily':
    case 'three_times_daily':
    case 'four_times_daily':
    case 'as_needed':
      console.log('DEBUG: Including date for frequency', schedule.frequency);
      return true;
    
    case 'weekly':
      const startDayOfWeek = new Date(scheduleStartDate + 'T00:00:00').getDay();
      const shouldInclude = dayOfWeek === startDayOfWeek;
      console.log('DEBUG: Weekly check', { 
        dayOfWeek, 
        startDayOfWeek, 
        shouldInclude 
      });
      return shouldInclude;
    
    case 'monthly':
      const startDayOfMonth = new Date(scheduleStartDate + 'T00:00:00').getDate();
      const shouldIncludeMonthly = dayOfMonth === startDayOfMonth;
      console.log('DEBUG: Monthly check', { 
        dayOfMonth, 
        startDayOfMonth, 
        shouldIncludeMonthly 
      });
      return shouldIncludeMonthly;
    
    default:
      console.log('DEBUG: Including date for default frequency');
      return true;
  }
};

  const getTimesForFrequency = (scheduleTime: string, frequency: string, scheduleDate: Date, isToday: boolean, startDateTime: Date): string[] => {
    const [baseHours, baseMinutes] = scheduleTime.split(':').map(Number);
    const baseDate = new Date(scheduleDate);
    baseDate.setHours(baseHours, baseMinutes, 0, 0);
    
    const times: string[] = [];
    const now = new Date();
    
    const shouldIncludeDose = (doseTime: Date): boolean => {
      const shouldInclude = doseTime >= startDateTime;
      console.log('DEBUG: shouldIncludeDose check', {
        doseTime: doseTime.toISOString(),
        startDateTime: startDateTime.toISOString(),
        shouldInclude
      });
      return shouldInclude;
    };
  
    const formatTime = (date: Date): string => {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    console.log('DEBUG: getTimesForFrequency', {
      scheduleTime,
      frequency,
      scheduleDate: scheduleDate.toISOString().split('T')[0],
      startDateTime: startDateTime.toISOString(),
      baseDate: baseDate.toISOString(),
      isToday,
      now: now.toISOString()
    });
    
    switch (frequency) {
      case 'daily':
      case 'weekly':
      case 'monthly':
      case 'as_needed':
        if (shouldIncludeDose(baseDate)) {
          times.push(scheduleTime);
          console.log('DEBUG: Added dose for basic frequency', scheduleTime);
        } else {
          console.log('DEBUG: Skipped dose - before start date/time', scheduleTime);
        }
        break;
      
      case 'twice_daily':
        if (shouldIncludeDose(baseDate)) {
          times.push(scheduleTime);
          console.log('DEBUG: Added first dose for twice daily', scheduleTime);
        }
        const secondDose = new Date(baseDate);
        secondDose.setHours(secondDose.getHours() + 12);
        
        if (shouldIncludeDose(secondDose)) {
          if (isToday) {
            if (secondDose.getDate() === scheduleDate.getDate() || secondDose > now) {
              times.push(formatTime(secondDose));
              console.log('DEBUG: Added second dose for today', formatTime(secondDose));
            } else {
              console.log('DEBUG: Skipped second dose for today - already passed', formatTime(secondDose));
            }
          } else {
             times.push(formatTime(secondDose));
            console.log('DEBUG: Added second dose for future day', formatTime(secondDose));
          }
        } else {
          console.log('DEBUG: Skipped second dose - before start date/time', formatTime(secondDose));
        }
        break;
      
      case 'three_times_daily':
        if (shouldIncludeDose(baseDate)) {
          times.push(scheduleTime);
          console.log('DEBUG: Added first dose for three times daily', scheduleTime);
        }
        
        const secondDose3 = new Date(baseDate);
        secondDose3.setHours(secondDose3.getHours() + 8);
        
        if (shouldIncludeDose(secondDose3)) {
          if (isToday) {
            if (secondDose3.getDate() === scheduleDate.getDate() || secondDose3 > now) {
              times.push(formatTime(secondDose3));
              console.log('DEBUG: Added second dose for three times daily', formatTime(secondDose3));
            } else {
              console.log('DEBUG: Skipped second dose for today - already passed', formatTime(secondDose3));
            }
          } else {
            times.push(formatTime(secondDose3));
          }
        } else {
          console.log('DEBUG: Skipped second dose - before start date/time', formatTime(secondDose3));
        }
        
        const thirdDose3 = new Date(baseDate);
        thirdDose3.setHours(thirdDose3.getHours() + 16);
        
        if (shouldIncludeDose(thirdDose3)) {
          if (isToday) {
            if (thirdDose3.getDate() === scheduleDate.getDate() || thirdDose3 > now) {
              times.push(formatTime(thirdDose3));
              console.log('DEBUG: Added third dose for three times daily', formatTime(thirdDose3));
            } else {
              console.log('DEBUG: Skipped third dose for today - already passed', formatTime(thirdDose3));
            }
          } else {
            times.push(formatTime(thirdDose3));
          }
        } else {
          console.log('DEBUG: Skipped third dose - before start date/time', formatTime(thirdDose3));
        }
        break;
      
      case 'four_times_daily':
        if (shouldIncludeDose(baseDate)) {
          times.push(scheduleTime);
          console.log('DEBUG: Added first dose for four times daily', scheduleTime);
        }
        
        const intervals = [6, 12, 18]; 
        for (const interval of intervals) {
          const nextDose = new Date(baseDate);
          nextDose.setHours(nextDose.getHours() + interval);
          
          if (shouldIncludeDose(nextDose)) {
            if (isToday) {
              if (nextDose.getDate() === scheduleDate.getDate() || nextDose > now) {
                times.push(formatTime(nextDose));
                console.log('DEBUG: Added interval dose for four times daily', formatTime(nextDose));
              } else {
                console.log('DEBUG: Skipped interval dose for today - already passed', formatTime(nextDose));
              }
            } else {
              times.push(formatTime(nextDose));
            }
          } else {
            console.log('DEBUG: Skipped interval dose - before start date/time', formatTime(nextDose));
          }
        }
        break;
      
      default:
        if (shouldIncludeDose(baseDate)) {
          times.push(scheduleTime);
        }
    }
    
    console.log('DEBUG: Final times for', scheduleTime, frequency, ':', times);
    return times;
  };

  for (const schedule of schedules) {
    console.log('DEBUG: Processing schedule', {
      id: schedule.id,
      medicationName: schedule.medicationName,
      start_date: schedule.start_date,
      schedule_time: schedule.schedule_time,
      frequency: schedule.frequency
    });
    
     const startDateTime = createStartDateTime(schedule);
    
    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0];
      console.log('DEBUG: Checking date', dateStr);
      
      if (!shouldIncludeDate(schedule, date)) {
        continue;
      }

       const today = new Date();
      const isToday = dateStr === today.toISOString().split('T')[0];
      console.log('DEBUG: Is today?', isToday);

      const times = getTimesForFrequency(schedule.schedule_time, schedule.frequency, date, isToday, startDateTime);

      console.log('DEBUG: Times to process for date', dateStr, ':', times);

      for (const time of times) {
        const scheduleDateTime = new Date(dateStr + 'T' + time);
        console.log('DEBUG: Processing time', time, 'for date', dateStr);
        
        const history = await db.getFirstAsync(
          `SELECT * FROM schedule_history 
           WHERE scheduleId = ? AND scheduled_date = ?`,
          [schedule.id, dateStr]
        ) as ScheduleHistory | null;

        console.log('DEBUG: History found', history);

        let current_status: 'scheduled' | 'taken' | 'missed' = 'scheduled';
        let last_taken: string | undefined = undefined;

        if (history) {
          if (history.status === 'taken' && history.taken_at) {
            current_status = 'taken';
            last_taken = history.taken_at;
            console.log('DEBUG: Status set to taken');
          } else if (history.status === 'missed') {
            current_status = 'missed';
            console.log('DEBUG: Status set to missed');
          }
        } else {
          if (now > scheduleDateTime) {
            const bufferTime = 1 * 60 * 1000; 
            const missedThreshold = new Date(scheduleDateTime.getTime() + bufferTime);
            
            if (now > missedThreshold) {
              current_status = 'missed';
              console.log('DEBUG: Status set to missed (time passed)');
            } else {
              current_status = 'scheduled';
              console.log('DEBUG: Status set to scheduled (within buffer)');
            }
          } else {
            current_status = 'scheduled';
            console.log('DEBUG: Status set to scheduled (future)');
          }
        }

        const timeIdentifier = time.replace(':', '');
        const uniqueId = parseInt(`${schedule.id}${dateStr.replace(/-/g, '')}${timeIdentifier}`);

        console.log('DEBUG: Adding schedule entry', {
          uniqueId,
          medicationName: schedule.medicationName,
          date: dateStr,
          time,
          status: current_status
        });

        result.push({
          ...schedule,
          id: uniqueId, 
          start_date: dateStr,
          schedule_time: time, 
          current_status,
          last_taken
        });
      }
    }
  }

  console.log('DEBUG: Final result count:', result.length);
  console.log('DEBUG: Final result:', result.map(r => ({
    id: r.id,
    medicationName: r.medicationName,
    date: r.start_date,
    time: r.schedule_time,
    status: r.current_status
  })));

  result.sort((a, b) => {
    const dateCompare = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    if (dateCompare !== 0) return dateCompare;
    
    const timeA = a.schedule_time.split(':').map(Number);
    const timeB = b.schedule_time.split(':').map(Number);
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
  });

  return result;
};

export const markScheduleAsTaken = async (scheduleId: number, scheduledDate: string, notes?: string): Promise<any> => {
  const originalScheduleId = parseInt(scheduleId.toString().replace(/\D/g, ''));
  
  const existingEntry = await db.getFirstAsync(
    `SELECT * FROM schedule_history WHERE scheduleId = ? AND scheduled_date = ?`,
    [originalScheduleId, scheduledDate]
  );

  if (existingEntry) {
    const result = await db.runAsync(
      `UPDATE schedule_history SET taken_at = ?, status = 'taken', notes = ?
       WHERE scheduleId = ? AND scheduled_date = ?`,
      [new Date().toISOString(), notes || null, originalScheduleId, scheduledDate]
    );
    return result;
  } else {
    const result = await db.runAsync(
      `INSERT INTO schedule_history (scheduleId, scheduled_date, taken_at, status, notes)
       VALUES (?, ?, ?, 'taken', ?)`,
      [originalScheduleId, scheduledDate, new Date().toISOString(), notes || null]
    );
    return result;
  }
};

export const updateScheduleStatus = async (scheduleId: number, status: 'missed' | 'skipped'): Promise<any> => {
  const result = await db.runAsync(
    `INSERT INTO schedule_history (scheduleId, taken_at, status)
     VALUES (?, ?, ?)`,
    [scheduleId, new Date().toISOString(), status]
  );
  return result;
};


export const deactivateSchedule = async (scheduleId: number): Promise<any> => {
  const result = await db.runAsync(
    `UPDATE medication_schedules SET is_active = 0 WHERE id = ?`,
    [scheduleId]
  );
  return result;
};

export const getUserSchedulesByDate = async (userId: number, date: string): Promise<any[]> => {
  const result = await db.getAllAsync(
    `SELECT ms.*, 
            CASE 
              WHEN sh.taken_at IS NOT NULL THEN 'taken'
              WHEN datetime(?) > datetime(?) || ' ' || ms.schedule_time THEN 'missed'
              ELSE 'scheduled'
            END as current_status,
            sh.taken_at as last_taken
     FROM medication_schedules ms
     LEFT JOIN (
       SELECT scheduleId, MAX(taken_at) as taken_at 
       FROM schedule_history 
       WHERE date(taken_at) = date(?) AND status = 'taken'
       GROUP BY scheduleId
     ) sh ON ms.id = sh.scheduleId
     WHERE ms.userId = ? AND ms.is_active = 1
     ORDER BY ms.schedule_time`,
    [date, date, date, userId]
  );
  return result;
};

export const getScheduleById = async (scheduleId: number): Promise<any> => {
  const result = await db.getFirstAsync(
    `SELECT * FROM medication_schedules WHERE id = ?`,
    [scheduleId]
  );
  return result;
};

export const getScheduleHistory = async (scheduleId: number, days: number = 30): Promise<any[]> => {
  const result = await db.getAllAsync(
    `SELECT * FROM schedule_history 
     WHERE scheduleId = ? AND date(taken_at) >= date('now', '-' || ? || ' days')
     ORDER BY taken_at DESC`,
    [scheduleId, days]
  );
  return result;
};

export const undoMarkAsTaken = async (scheduleId: number, scheduledDate: string): Promise<any> => {
  const result = await db.runAsync(
    `UPDATE schedule_history 
     SET taken_at = NULL, status = 'missed'
     WHERE scheduleId = ? AND scheduled_date = ? AND status = 'taken'`,
    [scheduleId, scheduledDate]
  );
  return result;
};

export const updateTakenTime = async (scheduleId: number, scheduledDate: string, newTakenTime: string): Promise<any> => {
  const result = await db.runAsync(
    `UPDATE schedule_history 
     SET taken_at = ?, notes = ?
     WHERE scheduleId = ? AND scheduled_date = ? AND status = 'taken'`,
    [newTakenTime, `Taken on ${new Date(newTakenTime).toLocaleString()}`, scheduleId, scheduledDate]
  );
  return result;
};

export const updateMedicationSchedule = async (
  scheduleId: number,
  medicationName: string,
  dosage: string,
  scheduleTime: string,
  frequency: string,
  startDate: string,
  endDate?: string
): Promise<any> => {
  const result = await db.runAsync(
    `UPDATE medication_schedules 
     SET medicationName = ?, dosage = ?, schedule_time = ?, frequency = ?, start_date = ?, end_date = ?
     WHERE id = ?`,
    [medicationName, dosage, scheduleTime, frequency, startDate, endDate || null, scheduleId]
  );
  return result;
};