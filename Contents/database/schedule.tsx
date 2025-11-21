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
      schedule_time TEXT NOT NULL, -- 24-hour format: "HH:MM"
      frequency TEXT DEFAULT 'daily', -- once, daily, weekly, monthly
      start_date TEXT NOT NULL, -- ISO string
      end_date TEXT, -- ISO string for temporary meds
      is_active INTEGER DEFAULT 1, -- 1 for active, 0 for inactive
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (medicationId) REFERENCES medications(name) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schedule_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheduleId INTEGER NOT NULL,
      taken_at TEXT NOT NULL, -- ISO string
      status TEXT DEFAULT 'taken', -- taken, missed, skipped
      notes TEXT,
      FOREIGN KEY (scheduleId) REFERENCES medication_schedules(id) ON DELETE CASCADE
    );
  `);
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
       AND (ms.end_date IS NULL OR date('now') <= date(ms.end_date))
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

export const markScheduleAsTaken = async (scheduleId: number, notes?: string): Promise<any> => {
  const result = await db.runAsync(
    `INSERT INTO schedule_history (scheduleId, taken_at, status, notes)
     VALUES (?, ?, 'taken', ?)`,
    [scheduleId, new Date().toISOString(), notes || null]
  );
  return result;
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

export const undoMarkAsTaken = async (scheduleId: number): Promise<any> => {
  const result = await db.runAsync(
    `DELETE FROM schedule_history 
     WHERE scheduleId = ? AND status = 'taken'
     AND taken_at = (
       SELECT MAX(taken_at) FROM schedule_history 
       WHERE scheduleId = ? AND status = 'taken'
     )`,
    [scheduleId, scheduleId]
  );
  return result;
};

export const updateTakenTime = async (scheduleId: number, newTakenTime: string): Promise<any> => {
  await db.runAsync(
    `DELETE FROM schedule_history 
     WHERE scheduleId = ? AND status = 'taken'
     AND taken_at = (
       SELECT MAX(taken_at) FROM schedule_history 
       WHERE scheduleId = ? AND status = 'taken'
     )`,
    [scheduleId, scheduleId]
  );

  const result = await db.runAsync(
    `INSERT INTO schedule_history (scheduleId, taken_at, status, notes)
     VALUES (?, ?, 'taken', ?)`,
    [scheduleId, newTakenTime, `Taken on ${new Date(newTakenTime).toLocaleString()}`]
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