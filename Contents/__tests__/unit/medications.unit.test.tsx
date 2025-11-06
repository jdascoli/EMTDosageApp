import db, {
  initializeDB,
  upsertMedication,
  getMedicationByName,
  getAllMedications,
  upsertDosage,
  getDosagesByMedication,
} from "@/database/medications";
jest.mock("expo-sqlite");


describe("Medication DB Functions", () => {
  
  beforeAll(async () => {
    await initializeDB();
  });

  beforeEach(async () => {
    await db.execAsync("DELETE FROM medications;");
    await db.execAsync("DELETE FROM dosages;");
  });

  it("inserts and retrieves a medication", async () => {
    await upsertMedication("Epinephrine", "Used for anaphylaxis", "None");
     const med = (await getMedicationByName("Epinephrine")) as {
      id: number;
      name: string;
      info: string;
      contraindications: string;
    } | null;

    expect(med).toBeTruthy();
    expect(med != null && med.name).toBe("Epinephrine");
    expect(med != null && med.info).toContain("anaphylaxis");
  });

  it("replaces duplicate medication entries", async () => {
    await upsertMedication("Aspirin", "Old Info", "None");
    await upsertMedication("Aspirin", "Updated Info", "Warning");
    const meds = (await getAllMedications()) as {
      id: number;
      name: string;
      info: string;
      contraindications: string;
    }[];

    expect(meds.length).toBe(1);
    expect(meds[0].info).toBe("Updated Info");
  });

  it("inserts and retrieves dosage information", async () => {
    await upsertMedication("Naloxone", "Reverses opioids", "None");
    await upsertDosage("Naloxone", 0.1, "mg", 2, null, 0, "Standard");

    const dosages = (await getDosagesByMedication("Naloxone")) as {
      id: number;
      medId: string;
      perKg: number | null;
      unit: string;
      maxDose: number | null;
      fixedDose: number | null;
      minAge: number | null;
      usage: string;
    }[];
    expect(dosages.length).toBe(1);
    expect(dosages[0].unit).toBe("mg");
  });
});
