import { Tabs } from 'expo-router';
import { ActivityIndicator, Platform, View } from 'react-native';

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

      await db.execAsync(`
        DELETE FROM medications
        WHERE rowid NOT IN (
          SELECT MIN(rowid)
          FROM medications
          GROUP BY name
        );
      `);

      await upsertMedication(
        "Epinephrine",
        "Increases heart rate, blood pressure, and dilates airways (used in anaphylaxis).",
        "Epinephrine can induce cardiac arrhythmias, chest pain, and myocardial ischemia, especially in patients with coronary artery disease, hypertension, or other organic heart diseases. It may also cause rapid increases in blood pressure that can lead to cerebral hemorrhage."
      );
      await upsertMedication(
        "Aspirin",
        "Reduces pain, fever, and inflammation; inhibits platelet aggregation.",
        "Patients can be allergic to Aspirin. Those with asthma or known bronchospasm associated with NSAIDs should be cautious. Increases risk of GI bleeding in patients with peptic ulcer disease or gastritis."
      );
      await upsertMedication(
        "Nitroglycerin",
        "Relaxes blood vessels, improving blood flow (used in angina).",
        "Contraindicated in patients with severe anemia, right-sided myocardial infarction, or those using PDE-5 inhibitors (e.g., sildenafil, tadalafil). Combining the two can cause dangerous hypotension."
      );
      await upsertMedication(
        "Albuterol",
        "Relaxes airway muscles to improve breathing (used in asthma/COPD).",
        "Avoid use in patients with known hypersensitivity to albuterol or its components; caution in patients with cardiac disorders due to possible tachycardia and hypertension."
      );
      await upsertMedication(
        "Naloxone",
        "Blocks opioid receptors to reverse overdoses.",
        "There are no absolute contraindications to naloxone use in emergencies. The only relative contraindication is known hypersensitivity to naloxone."
      );

      await upsertDosage("Epinephrine", 0.01, "mg", 0.3, null, 0, "Standard");
      await upsertDosage("Aspirin", 5, "mg", 325, null, 18, "Standard");
      await upsertDosage("Nitroglycerin", null, "mg", null, 0.4, 18, "Standard");
      await upsertDosage("Albuterol", 0.15, "mg", 5, null, 0, "Standard");
      await upsertDosage("Naloxone", 0.1, "mg", 2, null, 0, "Standard");
      await upsertDosage("Naloxone", 0.12, "mg", 2, null, 0, "ExampleUsage");

      setDbReady(true);
    }
    catch {
      console.error("DB initialization failed:");
    }
    };

    setupDB();
  }, []);

  // if (!dbReady) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
  //       <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].tint} />
  //     </View>
  //   );
  // }

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
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gear" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
