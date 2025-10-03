import { Text, TouchableOpacity, StyleSheet, TextInput, Button, Alert, View } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

export default function MedicationsDetailScreen() {
  const { name } = useLocalSearchParams();
  const [lbsWeight, setLbsWeight] = useState("");
  const [kgWeight, setKgWeight] = useState("");
  const [result, setResult] = useState<{ dose: number; unit: string } | null>(
    null
  );

const dosageGuidelines: Record<string, { perKg: number; unit: string }> = {
  Epinephrine: { perKg: 0.01, unit: "mg" },
  Aspirin: { perKg: 5, unit: "mg" },
  Nitroglycerin: { perKg: 0.3, unit: "mg" },
  Albuterol: { perKg: 0.15, unit: "mg" },
  Naloxone: { perKg: 0.1, unit: "mg" },
};

const medicationInfo: Record<string, string> = {
  Epinephrine: "Increases heart rate, blood pressure, and dilates airways (used in anaphylaxis).",
  Aspirin: "Reduces pain, fever, and inflammation; inhibits platelet aggregation.",
  Nitroglycerin: "Relaxes blood vessels, improving blood flow (used in angina).",
  Albuterol: "Relaxes airway muscles to improve breathing (used in asthma/COPD).",
  Naloxone: "Blocks opioid receptors to reverse overdoses.",
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
    
  // Error message for zero weight
  const handleCalculation = () => {
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

    const medInfo = dosageGuidelines[name as string];

    if (!medInfo) {
      Alert.alert("Error", "Dosage information not available for this medication");
      return;
    }

    const dose = +(weightValue * medInfo.perKg).toFixed(2); // round to 2 decimals
    setResult({ dose, unit: medInfo.unit });

  };

  const resetCalculator = () => {
    setLbsWeight("");
    setKgWeight("");
    setResult(null);
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <ThemedText type="title">{name}</ThemedText>

      <Text style={{ fontStyle: "italic", marginVertical: 8 }}>
        {medicationInfo[name as string] ?? "No mechanism info available."}
      </Text>

      <Text style={styles.instructionText}>
        Please fill in one of the weight inputs.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="145 lbs"
        value={lbsWeight}
        onChangeText={handleLbsChange} //setLbsWeight -> handleLbsChange
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="65.8 kg"
        value={kgWeight}
        onChangeText={handleKgChange} //setKgWeight -> handleKgChange
        keyboardType="numeric"
      />

      <View style={styles.buttonContainer}>
        <Button title="Calculate Dosage" onPress={handleCalculation} />
      </View>

      {/*Dose result appears under the button after pressing it */}
      {result && (
        <View style={styles.resultContainer}>
          <ThemedText type="subtitle" style={styles.resultTitle}>
            Calculated Dose:
          </ThemedText>
          <View style={styles.resultBox}>
            <Text style={styles.resultDose}>
              {result.dose} {result.unit}
            </Text>
          </View>
          <ThemedText style={styles.resultNote}>
            {kgWeight
              ? `For a patient weighing ${kgWeight} kg`
              : `For a patient weighing ${lbsWeight} lbs`}
          </ThemedText>
        </View>
      )}

      {/* Reset Button */}
      {result && (
        <View style={styles.buttonContainer}>
          <Button
            title="Calculate Again"
            onPress={resetCalculator}
            color="#e53e3e"
          />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
});
