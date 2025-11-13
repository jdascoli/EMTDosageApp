import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from "expo-router";
import { Image, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';// added for useState
import { Picker } from '@react-native-picker/picker';
import { WarningPopup } from '@/components/warningPopup.tsx';
import AsyncStorage from '@react-native-async-storage/async-storage';


type CertificationLevel = 'EMT-B' | 'EMT-I' | 'AEMT' | 'Paramedic';


export default function SettingsScreen() {
  const [isToggled, setIsToggled] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const toggleFeature = (featureName: string, isEnabled: boolean) => {
    // console.log("toggleFeature called with", featureName, isEnabled);
    switch (featureName) {
      case "EmployeeType":
        if (isEnabled) {
          console.log("Paramedic Mode Active");
          // Activate Paramedic Mode
          setIsToggled(true);
        } else {
          console.log("EMT Mode Active");
          // Activate EMT Mode
          setIsToggled(false);
        }
        break;

      default:
        console.log("Unknown feature");
    }
  };

  const handleCloseWarning = () => {
    setShowWarning(false);
  };

  const [certLevel, setCertLevel] = useState<CertificationLevel>('EMT-B');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCertificationLevel();
  }, []);

  const loadCertificationLevel = async () => {
    try {
      const saved = await AsyncStorage.getItem('certificationLevel');
      if (saved) {
        setCertLevel(saved as CertificationLevel);
        console.log('Loaded certification level:', saved);
      }
    } catch (error) {
      console.error('Failed to load certification level:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCertificationLevel = async (level: CertificationLevel) => {
    try {
      setCertLevel(level);
      await AsyncStorage.setItem('certificationLevel', level);
      console.log('Saved certification level:', level);
    } catch (error) {
      console.error('Failed to save certification level:', error);
    }
  };

  // Running Code
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/Gear-Background.png')}
          style={styles.settingsLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>

      {/* Account Section */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Account</ThemedText>
        <TouchableOpacity
          style={[styles.logoutButton]}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ThemedView>

    {/* Certification Level Section */}
    <ThemedView style={styles.stepContainer}>
      <ThemedText type="subtitle">Certification Level</ThemedText>
      <ThemedText style={styles.description}>
        Select your EMT certification level. This will be saved between sessions.
      </ThemedText>

    {!isLoading && (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={certLevel}
          onValueChange={(value) => saveCertificationLevel(value as CertificationLevel)}
          style={styles.picker}
        >
          <Picker.Item label="EMT-Basic" value="EMT-B" />
          <Picker.Item label="EMT-Intermediate" value="EMT-I" />
          <Picker.Item label="Advanced EMT" value="AEMT" />
          <Picker.Item label="Paramedic" value="Paramedic" />
        </Picker>
      </View>
    )}

    <ThemedText style={styles.currentLevel}>
      Current Level: {certLevel}
    </ThemedText>

    {/* Disclaimer Display Button */}
    <TouchableOpacity
      style={[styles.disclaimerButton]}
      onPress={() => setShowWarning(true)}
    >
      <Text style={styles.disclaimerButtonText}>Display Disclaimer</Text>
    </TouchableOpacity>

    {showWarning && <WarningPopup onClose={handleCloseWarning} />}
  </ThemedView>

    </ParallaxScrollView >
    );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 24,
  },
  settingsLogo: {
    height: 256,
    width: 417,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  switchStyle: {
    alignItems: 'flex-start',
    paddingLeft: 0
  },
  signupButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  description: {  
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  currentLevel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: '#007AFF',
  },
  logoutButton: {
    backgroundColor: "#b33",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disclaimerButton: {
    backgroundColor: "rgba(0, 122, 255, 0.0)",
    padding: 5,
    borderRadius: 0,
    alignItems: "left",
    marginVertical: 4,
    marginHorizontal: 5,
    width: 144,
    height: 30,
  },
  disclaimerButtonText: {
    color: "rgba(0, 122, 255, 1.0)",
    fontSize: 16,
    fontWeight: "600",
  },
});


