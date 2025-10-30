import { Text, TouchableOpacity, StyleSheet, TextInput, useColorScheme, Alert, View, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import RNPickerSelect from "react-native-picker-select";
import { getMedicationByName, getDosagesByMedication } from "@/database/medications";

export default function MedicationsDetailScreen() {
  const scheme = useColorScheme();
  const { name } = useLocalSearchParams();
  const [lbsWeight, setLbsWeight] = useState("");
  const [kgWeight, setKgWeight] = useState("");
  const [age, setAge] = useState("");
  const [result, setResult] = useState<{ dose: number; unit: string } | null>(null);
  const [dropDownSelection, setDropDownSelection] = useState<number | null>(null);
  const [dosages, setDosages] = useState<any[]>([]);

useEffect(() => {
  const loadDosages = async () => {
    const data = await getDosagesByMedication(name as string);
    setDosages(data);
  };
  loadDosages();
}, [name]);

const dropDownList = dosages.map((item) => ({
  label: item.usage,
  value: item.perKg,
}));

const [medication, setMedication] = useState<{
  id?: string;
  name?: string;
  info?: string;
  contraindications?: string;
} | null>(null);

useEffect(() => {
  const loadMedication = async () => {
    const med = await getMedicationByName(name as string);
    if (med) setMedication(med as {id: string, name: string; info: string; contraindications: string;});
    else setMedication(null);
  };
  loadMedication();
}, [name]);

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
  const medInfo = dosages.find((d) => d.usage === "Standard") || dosages[0] || null;
  const isFixedDose = medInfo && medInfo.fixedDose !== null;
    
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
        {medication?.info ?? "No info available."}
      </Text>
      <Text style={{ fontStyle: "italic", marginVertical: 8 }}>
        {medication?.contraindications ?? "No mechanism info available."}
      </Text>

      <View style={{ marginBottom: 10 }}>
        <Text>Select Usage:</Text>
        <RNPickerSelect
          onValueChange={(value) => setDropDownSelection(value)}
          items={dropDownList}
          value={dropDownSelection}
          placeholder={{ label: "(No Case Selected)", value: null }}
        />
      </View>

      <Text style={styles.instructionText}>
        Please enter your age and one of the weight inputs.
      </Text>
        
      {typeof medInfo?.minAge == 'number' && medInfo.minAge > 0 && (
        <Text style={[styles.warningText, {
          color: scheme === "dark" ? "#fbbf24" : "#d97706"
        }]}>
          ⚠️ This medication is only suitable for patients aged {medInfo.minAge}+
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
