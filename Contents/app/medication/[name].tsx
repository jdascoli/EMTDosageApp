import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function MedicationsDetailScreen() {
    const { name } = useLocalSearchParams();

    return (
        <View>
        <ThemedView>
            <Text></Text>
            <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <ThemedText type="title">
                {name}
            </ThemedText>
        </ThemedView>
            <Text>
                This is the dosage calculator screen for {name}.
            </Text>
        </View>
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
})