import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Button, StyleSheet } from 'react-native';

interface WarningPopupProps {
  onClose: () => void;
}

export const WarningPopup: React.FC<WarningPopupProps> = ({ onClose }) => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setIsPopupVisible(true); }, 1000); 
    return () => clearTimeout(timer);
  }, []);

  const closePopup = () => {
    setIsPopupVisible(false);
    onClose(); 
  };

  return (
    <Modal animationType="fade" transparent={true}visible={isPopupVisible} onRequestClose={closePopup}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.warningText}>Warning!</Text>
          <Text style={styles.text}>This App is Advisory Only!</Text>
          <Button title="Continue" color='maroon' onPress={closePopup} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  modalView: { margin: 20, backgroundColor: 'rgba(200,200,200,0.2)', borderRadius: 20, padding: 30, 
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,1)' },
  text: { fontWeight: 'bold', fontSize: 18, color: '#333', textAlign: 'center', marginBottom: 25 },
  warningText: { fontSize: 24, color: '#b91c1c', fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
});
