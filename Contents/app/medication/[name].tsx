import { Text, TouchableOpacity, StyleSheet, TextInput , Button} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function MedicationsDetailScreen() {
    const { name } = useLocalSearchParams();
    const [lbsWeight, setLbsWeight] = useState('');
    const [kgWeight, setKgWeight] = useState('');

       const handleCalculation = () => {
           // Insert code for calculation here... //
      };

    return (
        <ThemedView>
            <Text></Text>
            <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <ThemedText type="title">
                {name}
            </ThemedText>

            <Text></Text>
            <Text>
                Please fill in one the weight inputs.
            </Text>

            <TextInput
                style={styles.input}
                placeholder="145 lbs"
                value={lbsWeight}
                onChangeText={setLbsWeight}
            />
            <TextInput
                style={styles.input}
                placeholder="65.77 kg"
                value={kgWeight}
                onChangeText={setKgWeight}
            />
            <Button title="Calculate Dosage" onPress={handleCalculation} />
        </ThemedView>
    );
}




const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
    },

    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
        padding: 10,
    },

    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 50,
    },

    calculatorText: {
      fontSize: 22,
      fontWeight: 'bold',
    },
    input: {
        height: 40,
        width: 200,
        borderColor: 'gray',
        borderWidth: 1,
        paddingHorizontal: 10,
    },
})