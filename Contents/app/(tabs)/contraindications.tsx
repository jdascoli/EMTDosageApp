import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { getAllMedications, getMedicationByName } from "@/database/medications";

type Med = {
  id: number;
  name: string;
  info: string;
  contraindications: string;
  minCert: number;
  isOTC?: number;
};


export default function ContraindicationsScreen() {
  const [medications, setMedications] = useState<Med[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [contra, setContra] = useState<string>("");

    useEffect(() => {
    const loadMeds = async () => {
        const meds = await getAllMedications();
        setMedications(meds as Med[]);
    };
    loadMeds();
    }, []);


  const handleSelect = async (name: string) => {
    setSelected(name);
    const med = await getMedicationByName(name);
    setContra((med as Med)?.contraindications ?? "");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Contraindications
      </ThemedText>

      {/* Dropdown */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selected}
          onValueChange={handleSelect}
          style={styles.picker}
        >
          <Picker.Item label="Select a medication..." value="" />
          {medications.map((m) => (
            <Picker.Item key={m.id} label={m.name} value={m.name} />
          ))}
        </Picker>
      </View>

      {/* Display */}
      {selected !== "" && (
        <View style={styles.infoBox}>
          <ThemedText type="subtitle">{selected}</ThemedText>
          <Text style={styles.contraText}>{contra}</Text>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 20 },
  title: { textAlign: "center" },

  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: { height: 50 },

  infoBox: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },

  contraText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 20,
  },
});
