// Simple in-memory mock for expo-sqlite
type Row = Record<string, any>;

let medications: Row[] = [];
let dosages: Row[] = [];

export const openDatabaseSync = jest.fn(() => ({
    execAsync: jest.fn(async (sql: string) => {
        if (sql.includes("DELETE FROM medications")) medications = [];
        if (sql.includes("DELETE FROM dosages")) dosages = [];
    }),

    runAsync: jest.fn(async (sql: string, params?: any[]) => {
        if (sql.startsWith("INSERT OR REPLACE INTO medications")) {
            const [name, info, contraindications] = params ?? [];
            const existing = medications.find(m => m.name === name);
            if (existing) Object.assign(existing, { info, contraindications });
            else medications.push({
                id: medications.length + 1,
                name,
                info,
                contraindications,
            });
        }

        if (sql.startsWith("INSERT OR REPLACE INTO dosages")) {
            // The real function passes [medId, usage, medId, perKg, unit, maxDose, fixedDose, minAge, usage]
            const [, , medId, perKg, unit, maxDose, fixedDose, minAge, usage] = params ?? [];
            dosages.push({
                id: dosages.length + 1,
                medId,
                perKg,
                unit,
                maxDose,
                fixedDose,
                minAge,
                usage,
            });
        }

    }),

    getAllAsync: jest.fn(async (sql: string) => {
        if (sql.includes("FROM medications")) return medications;
        if (sql.includes("FROM dosages")) return dosages;
        return [];
    }),

    getFirstAsync: jest.fn(async (sql: string, params?: any[]) => {
        if (sql.includes("FROM medications WHERE name = ?")) {
            const name = params?.[0];
            return medications.find(m => m.name === name) ?? null;
        }
        return null;
    }),
}));
