import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';

const ScreenGradient = ({ children }) => (
  <LinearGradient colors={['#ffffff', '#edf2f8', '#d9e2ef']} style={{ flex: 1 }}>
    {children}
  </LinearGradient>
);

export default ScreenGradient;
