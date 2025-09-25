import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Button, StyleSheet } from 'react-native';

// Exported to be used in index.tsx
// TODO: Need to add global state to stop pop-ups after first time.
export const WarningPopup: React.FC = () => {
  const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false);
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPopupVisible(true);
    }, 1000); // Pop-up Appears after 1 second

    return () => clearTimeout(timer);
  }, []);

  // Closes Popup
  const closePopup = () => {
    setIsPopupVisible(false);
    setIsRead(true);
  };

  // Stops the warning from loading if already read, resets when app is closed
  if (isRead) return null;
  else return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isPopupVisible}
        onRequestClose={closePopup} // Handles Android hardware back button
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
              <Text style={styles.warningText}>Warning!</Text>
              <Text style={styles.text}>This App is Advisory Only!</Text>
              <Button title="Continue" color='maroon' onPress={closePopup} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" },
  centeredView: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(1,1,1,0.1)'},
  modalView: {margin: 20, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 20, padding: 35, alignItems: 'center'},
  text: { fontSize: 20, color: 'black', marginBottom: 70},
  warningText: { fontSize: 27, color: 'red', marginBottom: 15}
});