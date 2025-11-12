import * as SQLite from "expo-sqlite";
import { initializeHistory } from "./history";

const db = SQLite.openDatabaseSync("medications.db");

// Create the medications table if it doesn't exist
export const initializeDB = async () => {
  await db.execAsync(`PRAGMA foreign_keys = ON;`);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      info TEXT,
      contraindications TEXT,
      minCert INTEGER DEFAULT 1
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS dosages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medId TEXT NOT NULL,
      perKg REAL,
      unit TEXT NOT NULL,
      maxDose REAL,
      fixedDose REAL,
      minAge INTEGER,
      usage TEXT DEFAULT 'Standard',
      FOREIGN KEY (medId) REFERENCES medications(name) ON DELETE CASCADE
    );
  `);
  await db.execAsync(`
     /* Create users table */
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      certification TEXT NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
  await initializeHistory();
  try {
    const columns = await db.getAllAsync(`PRAGMA table_info(medications);`);
    const hasMinCert = columns.some((c: any) => c.name === 'minCert');

    if (!hasMinCert) {
      await db.execAsync(`ALTER TABLE medications ADD COLUMN minCert INTEGER DEFAULT 1;`);
      console.log("Added missing minCert column");
    }
  } catch (err) {
    console.warn("Failed to alter medications table:", err);
  }
  const result = await db.getFirstAsync(`PRAGMA foreign_keys`) as { foreign_keys: number } | null;
  console.log('Foreign keys enabled:', result?.foreign_keys);
};

// Insert or update medication
export const upsertMedication = async (
  nameE: string,
  infoE: string,
  contraindicationsE: string,
  minCertE: number
) => {
  await db.runAsync(
    `INSERT OR REPLACE INTO medications (name, info, contraindications, minCert)
     VALUES (?, ?, ?, ?)`,
    [nameE, infoE, contraindicationsE, minCertE]
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
  const medExists = await medicationExists(medId);
  if (!medExists) {
    throw new Error(`Medication "${medId}" does not exist`);
  }
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
// New medication insertion
export const addNewMedication = async (
  name: string,
  info: string,
  contraindications: string,
  minCert: number
) => {
  try {
    const result = await db.runAsync(
      `INSERT INTO medications (name, info, contraindications, minCert)
       VALUES (?, ?, ?, ?)`,
      [name, info, contraindications, minCert]
    );
    return result;
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      throw new Error(`Medication "${name}" already exists`);
    }
    throw error;
  }
};

// Medication update
export const updateMedicationInfo = async (
  name: string,
  info: string,
  contraindications: string
) => {
  const result = await db.runAsync(
    `UPDATE medications
     SET info = ?, contraindications = ?
     WHERE name = ?`,
    [info, contraindications, name]
  );

  if (result.changes === 0) {
    throw new Error(`Medication "${name}" not found`);
  }

  return result;
};

// New dosage insertion with existence check
export const addNewDosage = async (
  medId: string,
  perKg: number | null,
  unit: string,
  maxDose: number | null,
  fixedDose: number | null,
  minAge: number | null,
  usage: string = "Standard"
) => {
  const medExists = await medicationExists(medId);
  if (!medExists) {
    throw new Error(`Medication "${medId}" does not exist`);
  }

  const result = await db.runAsync(
    `INSERT INTO dosages (medId, perKg, unit, maxDose, fixedDose, minAge, usage)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [medId, perKg, unit, maxDose, fixedDose, minAge, usage]
  );
  return result;
};

// Dosage update
export const updateDosage = async (
  dosageId: number,
  perKg: number | null,
  unit: string,
  maxDose: number | null,
  fixedDose: number | null,
  minAge: number | null,
  usage: string = "Standard"
) => {
  const result = await db.runAsync(
    `UPDATE dosages 
     SET perKg = ?, unit = ?, maxDose = ?, fixedDose = ?, minAge = ?, usage = ?
     WHERE id = ?`,
    [perKg, unit, maxDose, fixedDose, minAge, usage, dosageId]
  );
  
  if (result.changes === 0) {
    throw new Error(`Dosage with ID ${dosageId} not found`);
  }
  
  return result;
};

// Simplify medication deletion with CASCADE
export const deleteMedication = async (name: string) => {
  const result = await db.runAsync(`DELETE FROM medications WHERE name = ?`, [name]);
  
  if (result.changes === 0) {
    throw new Error(`Medication "${name}" not found`);
  }
  
  return result;
};

// Dosage deletion
export const deleteDosage = async (dosageId: number) => {
  const result = await db.runAsync(`DELETE FROM dosages WHERE id = ?`, [dosageId]);
  
  if (result.changes === 0) {
    throw new Error(`Dosage with ID ${dosageId} not found`);
  }
  
  return result;
};

// Function to get medication with all dosages
export const getMedicationWithDosages = async (name: string) => {
  const medication = await getMedicationByName(name);
  if (!medication) return null;
  
  const dosages = await getDosagesByMedication(name);
  return {
    ...medication,
    dosages
  };
};

// Medication existence check
export const medicationExists = async (name: string) => {
  const result = await db.getFirstAsync(
    "SELECT 1 FROM medications WHERE name = ?",
    [name]
  );
  return !!result;
};

// Dosage existence check
export const dosageExists = async (dosageId: number) => {
  const result = await db.getFirstAsync(
    "SELECT 1 FROM dosages WHERE id = ?",
    [dosageId]
  );
  return !!result;
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
