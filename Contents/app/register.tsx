import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { createUser, getUserByName } from "@/database/medications"; // ADD: Import database functions
import { useColorScheme } from "@/hooks/useColorScheme";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function RegisterScreen() {
  const scheme = useColorScheme();
  const [name, setName] = useState("");
  const [certification, setCertification] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const certificationLevels = [
    "EMT (Emergency Medical Technician)",
    "Paramedic",
    "Other"
  ];

  // UPDATE: Modified handleRegister to use database
  const handleRegister = async () => {
    if (!name.trim() || !certification || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      // ADD: Check if user already exists
      const existingUser = await getUserByName(name.trim());
      if (existingUser) {
        Alert.alert("Error", "A user with this name already exists");
        return;
      }

      // ADD: Create user in database
      await createUser(name.trim(), certification, password);

      console.log("User registered and saved to database");
      
      Alert.alert("Success", "Account created successfully!", [
        { 
          text: "OK", 
          onPress: () => {
            router.back(); 
          }
        }
      ]);
    } catch (error) {
      console.error("Error creating user:", error);
      Alert.alert("Error", "Failed to create account. Please try again.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Create Account
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Join EMT Medical Dosage Calculator
        </ThemedText>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Full Name</ThemedText>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: scheme === "dark" ? "#1e293b" : "#fff",
                color: scheme === "dark" ? "#f8fafc" : "#111",
                borderColor: scheme === "dark" ? "#475569" : "gray"
              }
            ]}
            placeholder="Enter your full name"
            placeholderTextColor={scheme === "dark" ? "#94a3b8" : "#999"}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Certification Level</ThemedText>
          <ScrollView style={styles.certificationContainer}>
            {certificationLevels.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.certificationOption,
                  certification === level && styles.certificationSelected,
                  { 
                    backgroundColor: scheme === "dark" ? "#1e293b" : "#fff",
                    borderColor: scheme === "dark" ? "#475569" : "gray"
                  }
                ]}
                onPress={() => setCertification(level)}
              >
                <ThemedText style={certification === level ? styles.certificationTextSelected : {}}>
                  {level}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Password</ThemedText>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: scheme === "dark" ? "#1e293b" : "#fff",
                color: scheme === "dark" ? "#f8fafc" : "#111",
                borderColor: scheme === "dark" ? "#475569" : "gray"
              }
            ]}
            placeholder="Enter password (min 6 characters)"
            placeholderTextColor={scheme === "dark" ? "#94a3b8" : "#999"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Confirm Password</ThemedText>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: scheme === "dark" ? "#1e293b" : "#fff",
                color: scheme === "dark" ? "#f8fafc" : "#111",
                borderColor: scheme === "dark" ? "#475569" : "gray"
              }
            ]}
            placeholder="Confirm your password"
            placeholderTextColor={scheme === "dark" ? "#94a3b8" : "#999"}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.registerButton, { backgroundColor: "#007AFF" }]}
          onPress={handleRegister}
        >
          <Text style={styles.registerButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backLink}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backText}>
            Back to Settings
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.7,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  certificationContainer: {
    maxHeight: 200,
  },
  certificationOption: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  certificationSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  certificationTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  registerButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  backLink: {
    alignItems: "center",
    padding: 16,
  },
  backText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
});