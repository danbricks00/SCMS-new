import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { QRCodeUtils } from '../utils/qrCodeUtils';

const SimpleQRCode = ({ studentData, size = 200 }) => {
  if (!studentData) return null;

  const qrData = QRCodeUtils.generateStudentQR(studentData);

  return (
    <View style={styles.container}>
      <View style={styles.qrWrapper}>
        <QRCode
          value={qrData}
          size={size}
          color="#000000"
          backgroundColor="#FFFFFF"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

export default SimpleQRCode;
