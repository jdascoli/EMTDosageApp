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

    CREATE TABLE IF NOT EXISTS dosages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medId TEXT NOT NULL,
      perKg REAL,
      unit TEXT NOT NULL,
      maxDose REAL,
      fixedDose REAL,
      minAge INTEGER,
      usage TEXT DEFAULT 'Standard',
      FOREIGN KEY (medId) REFERENCES medications(name)
    );
     /* Create users table */
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      certification TEXT NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL
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

export const upsertDosage = async (
  medId: string,
  perKg: number | null,
  unit: string,
  maxDose: number | null,
  fixedDose: number | null,
  minAge: number | null,
  usage: string = "Standard"
) => {
  await db.runAsync(
    `INSERT OR REPLACE INTO dosages (id, medId, perKg, unit, maxDose, fixedDose, minAge, usage)
     VALUES (
       (SELECT id FROM dosages WHERE medId = ? AND usage = ?),
       ?, ?, ?, ?, ?, ?, ?
     )`,
    [medId, usage, medId, perKg, unit, maxDose, fixedDose, minAge, usage]
  );
};

export const getDosagesByMedication = async (medId: string) => {
  const result = await db.getAllAsync("SELECT * FROM dosages WHERE medId = ?", [medId]);
  return result as {
    id: number;
    medId: string;
    perKg: number | null;
    unit: string;
    maxDose: number | null;
    fixedDose: number | null;
    minAge: number | null;
    usage: string;
  }[];
};
export const createUser = async (
  name: string,
  certification: string,
  password: string
) => {
  const result = await db.runAsync(
    `INSERT INTO users (name, certification, password, createdAt)
     VALUES (?, ?, ?, ?)`,
    [name, certification, password, new Date().toISOString()]
  );
  return result;
};

export const getUserByName = async (name: string) => {
  const result = await db.getFirstAsync(
    "SELECT * FROM users WHERE name = ?",
    [name]
  );
  return result as {
    id: number;
    name: string;
    certification: string;
    password: string;
    createdAt: string;
  } | null;
};

export const getAllUsers = async () => {
  const result = await db.getAllAsync("SELECT * FROM users");
  return result as {
    id: number;
    name: string;
    certification: string;
    password: string;
    createdAt: string;
  }[];
};

export default db;
