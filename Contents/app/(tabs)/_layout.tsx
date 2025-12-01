import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import db, { initializeDB, upsertMedication, upsertDosage } from "@/database/medications";
import { useEffect, useState } from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const setupDB = async () => {
      try {
        await initializeDB();

        await upsertMedication(
          "Epinephrine",
          "Increases heart rate, blood pressure, and dilates airways (used in anaphylaxis).",
          "Epinephrine can induce cardiac arrhythmias, chest pain, and myocardial ischemia, especially in patients with coronary artery disease, hypertension, or other organic heart diseases. It may also cause rapid increases in blood pressure that can lead to cerebral hemorrhage.",
          1
        );
        await upsertMedication(
          "Aspirin",
          "Reduces pain, fever, and inflammation; inhibits platelet aggregation.",
          "Patients can be allergic to Aspirin. Those with asthma or known bronchospasm associated with NSAIDs should be cautious. Increases risk of GI bleeding in patients with peptic ulcer disease or gastritis.",
          1,
          1 //OTC
        );
        await upsertMedication(
          "Nitroglycerin",
          "Relaxes blood vessels, improving blood flow (used in angina).",
          "Contraindicated in patients with severe anemia, right-sided myocardial infarction, or those using PDE-5 inhibitors (e.g., sildenafil, tadalafil). Combining the two can cause dangerous hypotension.",
          3
        );
        await upsertMedication(
          "Albuterol",
          "Relaxes airway muscles to improve breathing (used in asthma/COPD).",
          "Avoid use in patients with known hypersensitivity to albuterol or its components; caution in patients with cardiac disorders due to possible tachycardia and hypertension.",
          3
        );
        await upsertMedication(
          "Naloxone",
          "Blocks opioid receptors to reverse overdoses.",
          "There are no absolute contraindications to naloxone use in emergencies. The only relative contraindication is known hypersensitivity to naloxone.",
          3
        );
        await upsertMedication(
          "Glucose",
          "Raises blood glucose levels rapidly to treat severe hypoglycemia in conscious patients.",
          "Contraindicated in patients with altered mental status or inability to swallow. Do not give to unconscious patients due to aspiration risk.",
          1,
          1 // OTC
        );
        await upsertMedication(
          "Activated Charcoal",
          "Adsorbs ingested toxins in the gastrointestinal tract to prevent absorption (used in poisoning/overdose).",
          "Contraindicated in patients with altered mental status, GI perforation, or caustic ingestions. Not effective for alcohols, acids, alkalis, or iron.",
          1,
          1 // OTC
        );
        await upsertMedication(
          "Oxygen",
          "Increases oxygen saturation in blood to treat hypoxia and respiratory distress.",
          "No absolute contraindications in emergency settings. Use cautiously in COPD patients (risk of CO2 retention). Monitor for oxygen toxicity in prolonged high-concentration use.",
          1,
          1 // OTC
        );

        await upsertMedication(
          "Oral Glucose",
          "Quick-absorbing glucose gel for conscious hypoglycemic patients.",
          "Contraindicated in unconscious or seizing patients. Patient must be able to swallow and protect airway.",
          1,
          1 // OTC
        );
        await upsertMedication(
          "Epinephrine Auto-Injector",
          "Pre-filled automatic injection device for anaphylaxis emergency treatment.",
          "Same contraindications as epinephrine. Use cautiously in elderly and cardiac patients. May cause anxiety, tremors, and palpitations.",
          1
        );
        await upsertMedication(
          "Glucagon",
          "Hormone that raises blood glucose by stimulating liver glycogen breakdown (used when IV access unavailable).",
          "Contraindicated in pheochromocytoma. Ineffective in chronic hypoglycemia or adrenal insufficiency. May cause nausea and vomiting.",
          1
        );
        await upsertMedication(
          "Atropine",
          "Increases heart rate by blocking vagal nerve activity (used in symptomatic bradycardia).",
          "Contraindicated in narrow-angle glaucoma, myasthenia gravis, and tachycardia. May cause dry mouth, blurred vision, urinary retention, and confusion in elderly.",
          3
        );
        await upsertMedication(
          "Amiodarone",
          "Antiarrhythmic medication for life-threatening ventricular arrhythmias and atrial fibrillation.",
          "Contraindicated in severe sinus node dysfunction, second/third-degree AV block (without pacemaker), and cardiogenic shock. May cause hypotension, bradycardia, and phlebitis.",
          3
        );
        await upsertMedication(
          "Morphine",
          "Potent opioid analgesic for severe pain management and reduces anxiety in acute MI.",
          "Contraindicated in respiratory depression, hypotension, and altered mental status. May cause nausea, vomiting, respiratory depression, and hypotension. Have naloxone available.",
          3
        );
        await upsertMedication(
          "Dextrose",
          "Intravenous glucose solution for severe hypoglycemia in unconscious or seizing patients.",
          "Contraindicated in intracranial hemorrhage. May cause tissue necrosis if extravasation occurs. Use cautiously in patients with increased intracranial pressure.",
          3
        );
        await upsertMedication(
          "Diphenhydramine",
          "Antihistamine for allergic reactions, anaphylaxis adjunct, and dystonic reactions.",
          "Contraindicated in acute asthma attack, narrow-angle glaucoma, and prostatic hypertrophy. May cause drowsiness, dry mouth, and urinary retention.",
          3
        );
        await upsertMedication(
          "Adenosine",
          "Ultra-short-acting agent that slows AV node conduction (used for SVT conversion).",
          "Contraindicated in second/third-degree AV block, sick sinus syndrome, and bronchospasm. May cause transient asystole, flushing, chest pain, and dyspnea. Use reduced dose with central line.",
          3
        );
        await upsertMedication(
          "Dopamine",
          "Vasopressor and inotrope that increases cardiac output and blood pressure.",
          "Contraindicated in pheochromocytoma and uncorrected tachyarrhythmias. May cause tachycardia, arrhythmias, and tissue necrosis if extravasation occurs.",
          3
        );
        await upsertMedication(
          "Lidocaine",
          "Local anesthetic and antiarrhythmic for ventricular arrhythmias.",
          "Contraindicated in complete heart block, severe SA node dysfunction, and known hypersensitivity. May cause CNS toxicity (seizures, confusion), hypotension, and bradycardia.",
          3
        );


        await upsertDosage("Epinephrine", 0.01, "mg", 0.3, null, 0, "Standard");
        await upsertDosage("Aspirin", 5, "mg", 325, null, 18, "Standard");
        await upsertDosage("Nitroglycerin", null, "mg", null, 0.4, 18, "Standard");
        await upsertDosage("Albuterol", 0.15, "mg", 5, null, 0, "Standard");
        await upsertDosage("Naloxone", 0.1, "mg", 2, null, 0, "Standard");
        await upsertDosage("Naloxone", 0.12, "mg", 2, null, 0, "ExampleUsage");
        await upsertDosage("Glucose", null, "g", null, 15, 0, "Standard");
        await upsertDosage("Activated Charcoal", 1, "g", 50, null, 1, "Standard");
        await upsertDosage("Oxygen", null, "L/min", 15, null, 0, "Standard");
        await upsertDosage("Oral Glucose", null, "g", null, 15, 4, "Standard");
        await upsertDosage("Epinephrine Auto-Injector", null, "mg", null, 0.3, 12, "Adult");
        await upsertDosage("Epinephrine Auto-Injector", null, "mg", null, 0.15, 0, "Pediatric");
        await upsertDosage("Glucagon", null, "mg", null, 1, 12, "Adult");
        await upsertDosage("Glucagon", null, "mg", null, 0.5, 0, "Pediatric");
        await upsertDosage("Atropine", null, "mg", 3, 0.5, 18, "Standard");
        await upsertDosage("Amiodarone", null, "mg", 450, 150, 18, "Cardiac Arrest");
        await upsertDosage("Amiodarone", null, "mg", 150, 150, 18, "Stable VT");
        await upsertDosage("Morphine", 0.1, "mg", 15, null, 18, "Standard");
        await upsertDosage("Dextrose", null, "mL", 250, 25, 0, "D50 Adult");
        await upsertDosage("Dextrose", 0.5, "g", 12.5, null, 0, "D25 Pediatric");
        await upsertDosage("Diphenhydramine", null, "mg", 50, 25, 12, "Standard");
        await upsertDosage("Adenosine", null, "mg", 12, 6, 18, "First Dose");
        await upsertDosage("Adenosine", null, "mg", 12, 12, 18, "Second Dose");
        await upsertDosage("Dopamine", null, "mcg/kg/min", 20, 5, 18, "Standard");
        await upsertDosage("Lidocaine", 1, "mg", 300, null, 18, "Cardiac Arrest");
        await upsertDosage("Lidocaine", null, "mg", 150, 100, 18, "Stable VT");


        await db.execAsync(`
        DELETE FROM medications
        WHERE rowid NOT IN (
          SELECT MIN(rowid)
          FROM medications
          GROUP BY name
        );
      `);

        setDbReady(true);
      }
      catch {
        console.error("DB initialization failed:");
      }
    };

    setupDB();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // TODO: Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
        }}
     />
     <Tabs.Screen
      name="contraindications"
      options={{
        title: "Contraindications",
        tabBarIcon: ({ color }) => (
          <IconSymbol size={28} name="exclamationmark.triangle.fill" color={color} />
        ),
      }}
    />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gear" color={color} />
          ),
        }}
      />
      
     <Tabs.Screen
        name="add_schedule"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
    </Tabs>
  );
}
