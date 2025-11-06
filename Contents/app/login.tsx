import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
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

export default function LoginScreen() {
  const scheme = useColorScheme();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  
  const handleLogin = async () => {
    if (!name.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    
    console.log("Login attempt with:", name);
    router.replace("/(tabs)");
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Welcome Back
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Sign in to EMT Medical Dosage Calculator
        </ThemedText>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Name</ThemedText>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: scheme === "dark" ? "#1e293b" : "#fff",
                color: scheme === "dark" ? "#f8fafc" : "#111",
                borderColor: scheme === "dark" ? "#475569" : "gray"
              }
            ]}
            placeholder="Enter your name"
            placeholderTextColor={scheme === "dark" ? "#94a3b8" : "#999"}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Password Input */}
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
            placeholder="Enter your password"
            placeholderTextColor={scheme === "dark" ? "#94a3b8" : "#999"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: "#007AFF" }]}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <ThemedText style={styles.registerPrompt}>
            Don't have an account?{" "}
          </ThemedText>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 50,
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
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerPrompt: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
});