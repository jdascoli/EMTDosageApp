import { Text, TouchableOpacity, StyleSheet, TextInput, useColorScheme, Alert, View, ScrollView } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import RNPickerSelect from "react-native-picker-select";

export default function MedicationsDetailScreen() {
  const scheme = useColorScheme();
  const { name } = useLocalSearchParams();
  const [lbsWeight, setLbsWeight] = useState("");
  const [kgWeight, setKgWeight] = useState("");
  const [age, setAge] = useState("");
  const [result, setResult] = useState<{ dose: number; unit: string } | null>(null);
  const [dropDownSelection, setDropDownSelection] = useState<number | null>(null);

const dosageGuidelines: Record<string, { perKg?: number; unit: string; maxDose?: number; fixedDose?: number; minAge?: number;}> = {
  Epinephrine: { perKg: 0.01, unit: "mg", maxDose: 0.3, minAge:0 },
  Aspirin: { perKg: 5, unit: "mg", maxDose: 325, minAge:18 },
  Nitroglycerin: { unit: "mg", fixedDose: 0.4, minAge:18 },
  Albuterol: { perKg: 0.15, unit: "mg", maxDose: 5, minAge:0 },
  Naloxone: { perKg: 0.1, unit: "mg", maxDose: 2, minAge:0 },
};

const dropDownDosageOptions = [
    { medId: "Epinephrine",   perKg: 0.01, unit: "mg", usage: "Standard" },
    { medId: "Aspirin",       perKg: 5.00, unit: "mg", usage: "Standard" },
    { medId: "Nitroglycerin", perKg: 0.30, unit: "mg", usage: "Standard" },
    { medId: "Albuterol",     perKg: 0.15, unit: "mg", usage: "Standard" },
    { medId: "Naloxone",      perKg: 0.10, unit: "mg", usage: "Standard" },
    { medId: "Naloxone",      perKg: 0.12, unit: "mg", usage: "ExampleUsage" },
];
// List of only Med-specific Entries
const filteredDropdown = dropDownDosageOptions.filter(
  (item) => item.medId === name
);

const dropDownList = filteredDropdown.map((item, index) => ({
  label: `${item.usage}`,
  value: item.perKg,
}));

const medicationInfo: Record<string, string> = {
  Epinephrine: "Increases heart rate, blood pressure, and dilates airways (used in anaphylaxis).",
  Aspirin: "Reduces pain, fever, and inflammation; inhibits platelet aggregation.",
  Nitroglycerin: "Relaxes blood vessels, improving blood flow (used in angina).",
  Albuterol: "Relaxes airway muscles to improve breathing (used in asthma/COPD).",
  Naloxone: "Blocks opioid receptors to reverse overdoses.",
};

const medicationContraindications: Record<string, string> = {
  Epinephrine: "Epinephrine can induce cardiac arrhythmias, chest pain, and myocardial ischemia, especially in patients with coronary artery disease, hypertension, or other organic heart diseases. It may also cause rapid increases in blood pressure that can lead to cerebral hemorrhage, particularly in older adults.",
  Aspirin: "Patients can be allergic to Aspirin. Patients who have asthma should be cautious if they have asthma or known bronchospasm associated with NSAIDs. Aspirin increases the risk of GI bleeding in patients who already suffer from peptic ulcer disease or gastritis.",
  Nitroglycerin: "Known history of increased intracranial pressure, severe anemia, right-sided myocardial infarction, or hypersensitivity to nitroglycerin are contraindications to nitroglycerin therapy. Concurrent use of nitroglycerin with PDE-5 inhibitors (e.g., sildenafil citrate, vardenafil hydroxide, tadalafil) is absolutely contraindicated. PDE-5 inhibitors have proven to accentuate the hypotensive effects of nitrates and precipitate syncopal episodes.",
  Albuterol: "This should not be used for patients who have a history of hypersensitivity to the drug or any of its components, and its use should be cautiously considered in patients with certain pre-existing conditions due to potential adverse effects.",
  Naloxone: "There are no absolute contraindications to using naloxone in an emergency. The only relative contraindication is known hypersensitivity to naloxone.",
};

const handleAgeChange = (text: string) => {

  if (text === "" || /^[1-9]\d*$/.test(text)) {
    const numeric = parseInt(text) || 0;
    const displayValue = numeric > 99 ? "99" : numeric.toString();
    setAge(displayValue);
    setResult(null);// initialize
  }
};


// Handle lb input - integers only
  const handleLbsChange = (text: string) => {
    
    if (text === "" || /^\d+$/.test(text)){
      setLbsWeight(text);

      //Auto convvert to kg
      if(text && text !== "0") {
        const kgValue = (parseInt(text) / 2.20462).toFixed(1);
        setKgWeight(kgValue);
      } else if (text === ""){
        setKgWeight("");
      }
      setResult(null);
      }
    };

// Handle Kg input - one decimal place only
  const handleKgChange = (text: string) => {
    if(text === "" || /^\d+\.?\d{0,1}$/.test(text)) {
      setKgWeight(text);

      //Auto convert to lbs
      if (text && text !== "0" && text !== "0.0") {
        const lbValue = Math.round(parseFloat(text) * 2.20462);
        setLbsWeight(lbValue.toString());
      } else if (text === "") {
        setLbsWeight("");
      }

      // Clear result when input changes
      setResult(null);
    }
  };
  const medInfo = dosageGuidelines[name as string];
  const isFixedDose = medInfo && !!medInfo.fixedDose;
    
  // Error message for zero weight
  const handleCalculation = () => {
    // Age verification
    const ageValue = parseInt(age);
    if (!age || isNaN(ageValue) || ageValue <= 0) {
      Alert.alert("Error", "Please enter a valid age (positive integer)");
      return;
    }

    // Adult-only

    let weightValue: number;

    if (kgWeight) {
      weightValue = parseFloat(kgWeight);
    } else if (lbsWeight) {
      weightValue = parseFloat(lbsWeight) / 2.20462; // Convert lbs to kg
    } else {
      Alert.alert(
        "Error",
        "Please enter a weight in either pounds or kilograms"
      );
      return;
    }

    // Check for zero weight
    if (isNaN(weightValue) || weightValue <= 0) {
      Alert.alert("Error", "Weight must be greater than 0");
      return;
    }

    if (isFixedDose && medInfo.fixedDose) {
      setResult({ dose: medInfo.fixedDose, unit: medInfo.unit });
      return;
    }

    if (medInfo?.minAge && ageValue < medInfo.minAge) {
      Alert.alert(
        "Age Restriction",
        `${name} is only suitable for patients aged ${medInfo.minAge} and above. This medication is not recommended for patients under ${medInfo.minAge} years old.`,
        [{ text: "OK" }]
      );
      return;
    }

    

    if (!medInfo) {
      Alert.alert("Error", "Dosage information not available for this medication");
      return;
    }

    let dose = +(weightValue * (medInfo.perKg ?? 0)).toFixed(2);
    if(dropDownSelection != null){
        dose = +(weightValue * (dropDownSelection ?? 0)).toFixed(2);
    }
    if (dose > (medInfo.maxDose ?? 0)) {
      dose = medInfo.maxDose ?? 0;
      Alert.alert("Note", `Calculated dose exceeds max safe dose. Capped at ${dose} ${medInfo.unit}.`);
    }

    setResult({ dose, unit: medInfo.unit });

  };

  const resetCalculator = () => {
    setLbsWeight("");
    setKgWeight("");
    setAge("40");
    setResult(null);
    setAge("");
  };

  if (isFixedDose && !result && medInfo?.fixedDose) {
    setResult({ dose: medInfo.fixedDose, unit: medInfo.unit });
  }
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        alwaysBounceVertical={false}
        overScrollMode="always"
      >
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <ThemedText type="title">{name}</ThemedText>

      <Text style={{ fontStyle: "italic", marginVertical: 8 }}>
        {medicationInfo[name as string] ?? "No info available."}
      </Text>
      <Text style={{ fontStyle: "italic", marginVertical: 8 }}>
        {medicationContraindications[name as string] ?? "No mechanism info available."}
      </Text>

      <View style={{ marginBottom: 10 }}>
        <Text>Select Usage:</Text>
        <RNPickerSelect
          onValueChange={(value) => setDropDownSelection(value)}
          items={dropDownList}
          value={dropDownSelection}
          placeholder={{ label: "(No Case Selected)", value: dosageGuidelines.name }}
        />
      </View>

      <Text style={styles.instructionText}>
        Please enter your age and one of the weight inputs.
      </Text>
        
        {typeof dosageGuidelines[name as string]?.minAge === "number" &&
      dosageGuidelines[name as string].minAge! > 0 && (
        <Text style={[styles.warningText, {
          color: scheme === "dark" ? "#fbbf24" : "#d97706"
        }]}>
          ⚠️ This medication is only suitable for patients aged {dosageGuidelines[name as string].minAge}+
        </Text>
      )}

      {/* Age Input Field */}
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input1,
            {
              backgroundColor: scheme === "dark" ? "#1e293b" : "#fff",
              color: scheme === "dark" ? "#f8fafc" : "#111",
              borderColor: scheme === "dark" ? "#475569" : "gray",
            },
          ]}
          placeholder="35"
          placeholderTextColor={scheme === "dark" ? "#94a3b8" : "#999"}
          value={age}
          onChangeText={handleAgeChange}
          keyboardType="numeric"
        />
        <Text style={[styles.unit, { color: scheme === "dark" ? "#f8fafc" : "#111" }]}>years</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input1,{ 
              backgroundColor: scheme === "dark" ? "#1e293b" : "#fff", 
              color: scheme === "dark" ? "#f8fafc" : "#111",
              borderColor: scheme === "dark" ? "#475569" : "gray" 
            }
          ]}
          placeholder="145"
          placeholderTextColor={scheme === "dark" ? "#94a3b8" : "#999"}
          value={lbsWeight}
          onChangeText={handleLbsChange}
          keyboardType="numeric"
        />
        <Text style={[styles.unit, { color: scheme === "dark" ? "#f8fafc" : "#111" }]}>lbs</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input1,{ 
              backgroundColor: scheme === "dark" ? "#1e293b" : "#fff", 
              color: scheme === "dark" ? "#f8fafc" : "#111",
              borderColor: scheme === "dark" ? "#475569" : "gray" 
            }
          ]}
          placeholder="65.8"
          placeholderTextColor={scheme === "dark" ? "#94a3b8" : "#999"}
          value={kgWeight}
          onChangeText={handleKgChange}
          keyboardType="numeric"
        />
        <Text style={[styles.unit, { color: scheme === "dark" ? "#f8fafc" : "#111" }]}>kg</Text>
      </View>

      {!isFixedDose && (
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: scheme === "dark" ? "#3b82f6" : "#007AFF" }]}
        onPress={handleCalculation}>
        <Text style={styles.actionButtonText}>Calculate Dosage</Text>
      </TouchableOpacity>
    )}

    {isFixedDose && (
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: scheme === "dark" ? "#475569" : "#cbd5e1" }]}
        disabled>
        <Text style={[ styles.actionButtonText, { color: "#94a3b8" }]}>
          Calculate Dosage
        </Text>
      </TouchableOpacity>
    )}

      {/*Dose result appears under the button after pressing it */}
      {result && (
        <View style={styles.resultContainer}>
          <ThemedText type="subtitle" style={styles.resultTitle}>
            {isFixedDose ? "Standard Dose:" : "Calculated Dose:"}
          </ThemedText>
          <View
            style={[
              styles.resultBox,{
                backgroundColor: scheme === "dark" ? "#1e293b" : "#e6fffa",
                borderColor: scheme === "dark" ? "#38bdf8" : "#38b2ac"
              }]}>
            <Text style={[ styles.resultDose,{ color: scheme === "dark" ? "#f8fafc" : "#234e52" }]}>
              {result.dose} {result.unit}
            </Text>
          </View>
          {isFixedDose && (
            <ThemedText style={styles.resultNote}>
              This medication has a fixed standard dose.
            </ThemedText>
          )}
          {!isFixedDose && (
            <ThemedText style={styles.resultNote}>
              {kgWeight
                ? `For a patient weighing ${kgWeight} kg`
                : `For a patient weighing ${lbsWeight} lbs`}
            </ThemedText>
          )}
        </View>
      )}

      {/* Reset Button */}
      {!isFixedDose && result && (
        <TouchableOpacity
          style={[styles.actionButton,{ backgroundColor: "#e53e3e", marginBottom: 30 }]}
          onPress={resetCalculator}>
          <Text style={styles.actionButtonText}>Calculate Again</Text>
        </TouchableOpacity>
      )}
       <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    minHeight: "0%",
  },
    scrollContent: {
    flexGrow: 1,
    padding: 16,
    minHeight: "100%",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    padding: 10,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 50,
  },
  calculatorText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  input: {
    height: 40,
    width: 200,
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 15,
    alignSelf: "center",
  },
  buttonContainer: {
    marginVertical: 15,
    width: 200,
    alignSelf: "center",
  },
  // Result container appears under the button
  resultContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  resultTitle: {
    marginBottom: 15,
    textAlign: "center",
  },
  resultBox: {
    backgroundColor: "#e6fffa",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#38b2ac",
    minWidth: 200,
    alignItems: "center",
  },
  resultDose: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#234e52",
  },
  resultNote: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  input1: {
    height: 40,
    width: 120,
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  unit: {
    width: 40,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButton: {
    width: 200,           
    alignSelf: "center",    
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  warningText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 10,
    paddingHorizontal: 12,
  },
  bottomSpacer: {
    height: 50,
  },
  selectedText: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: 'white'
  }
});
