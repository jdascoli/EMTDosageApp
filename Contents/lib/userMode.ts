import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_MODE_KEY = 'isGuestMode';

// Check if user is in guest mode
export const isGuestMode = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Failed to check guest mode:', error);
    return false;
  }
};

// Enable guest mode
export const enableGuestMode = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
  } catch (error) {
    console.error('Failed to enable guest mode:', error);
  }
};

// Disable guest mode (login)
export const disableGuestMode = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
  } catch (error) {
    console.error('Failed to disable guest mode:', error);
  }
};