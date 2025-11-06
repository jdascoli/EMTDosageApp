import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { createUser, getUserByName } from "@/database/medications"; // ADD: Import database functions
import { useColorScheme } from "@/hooks/useColorScheme";
import { router } from "expo-router";
import { hashPassword,validatePasswordStrength } from "@/lib/auth";
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

  const handleRegister = async () => {
    const pw = password.trim();
    const cpw = confirmPassword.trim();

    if (!name.trim()) {
      Alert.alert("Error","Please enter your full name");
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert("Invalid Name", "Please enter your full name");
      return;
    }

    if (!certification.trim()) {
      Alert.alert("Error","Please select your certification level");
      return;
    }

    if (!pw) {
      Alert.alert("Error","Please enter a password");
      return;
    }

    if (!cpw) {
      Alert.alert("Error","Please confirm your password");
      return;
    }

    if (pw !== cpw) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (pw.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    const validation = validatePasswordStrength(pw);
    if (!validation.isValid) {
      Alert.alert("Weak Password", validation.message);
      return;
    }

    try {
      const existingUser = await getUserByName(name.trim());
      if (existingUser) {
        Alert.alert("Error", "A user with this name already exists");
        return;
      }

      const hashedPassword = await hashPassword(password);
      await createUser(name.trim(), certification, hashedPassword);


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
          <View style={styles.labelContainer}>
          <ThemedText style={styles.label}>Full Name</ThemedText>
          <Text style={styles.requiredStar}>*</Text>
          </View>
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
          {!name && (
            <Text style={styles.requiredHint}>Please enter your full name</Text>
          )}
          {name && name.trim().length < 2 && (
            <Text style={styles.validationError}>Name must be at leat 2 characters</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <ThemedText style={styles.label}>Certification Level</ThemedText>
            <Text style={styles.requiredStar}>*</Text>
          </View>
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
          {!certification && (
            <Text style={styles.requiredHint}>Please select a certification level</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <Text style={styles.requiredStar}>*</Text>
          </View>
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
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!password && (
            <Text style={styles.requiredHint}>Please enter your password</Text>
          )}
          {password && password.length < 6 && (
            <Text style={styles.validationError}>Password must be at least 6 characters</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <Text style={styles.requiredStar}>*</Text>
          </View>
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
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!confirmPassword ? (
            <Text style={styles.requiredHint}>Please confirm your password</Text>
          ) : password !== confirmPassword ? (
            <Text style={styles.validationError}>Passwords do not match</Text>
          ) : null}
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
   requiredNote: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
   labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  requiredStar: {
    color: "#ff3b30",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 4,
  },
  requiredHint: {
    color: "#ff3b30",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
   validationError: {
    color: "#ff3b30",
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 20,
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