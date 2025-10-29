import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("medications.db");

// Create the medications table if it doesn't exist
export const initializeDB = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      info TEXT,
      contraindications TEXT
    );
  `);
};

// Insert or update medication
export const upsertMedication = async (
  name: string,
  info: string,
  contraindications: string
) => {
  await db.runAsync(
    `INSERT OR REPLACE INTO medications (name, info, contraindications)
     VALUES (?, ?, ?)`,
    [name, info, contraindications]
  );
};

// Fetch all medications
export const getAllMedications = async () => {
  const result = await db.getAllAsync("SELECT * FROM medications");
  return result;
};

// Fetch one medication by name
export const getMedicationByName = async (name: string) => {
  const result = await db.getFirstAsync(
    "SELECT * FROM medications WHERE name = ?",
    [name]
  );
  return result;
};

export default db;
