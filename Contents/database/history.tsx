import db from "./medications";
import { getCurrentUserId } from "@/lib/session";

// Create the user history table if it doesn’t exist
export const initializeHistory = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      medicationId INTEGER,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (medicationId) REFERENCES medications(id)
    );
  `);
};

// Add a history record for the current user
export const addHistoryEntry = async (medicationId: number, action: string) => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("No user logged in");

  await db.runAsync(
    `INSERT INTO history (userId, medicationId, timestamp, action)
     VALUES (?, ?, ?, ?)`,
    [userId, medicationId, new Date().toISOString(), action]
  );
};

// Get all history for the current user
export const getUserHistory = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const result = await db.getAllAsync(
    `SELECT * FROM history WHERE userId = ? ORDER BY timestamp DESC`,
    [userId]
  );
  return result;
};
