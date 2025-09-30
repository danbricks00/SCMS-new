import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Debug component to show loading status
const DebugInfo = () => {
  const [info, setInfo] = React.useState({
    loadTime: new Date().toISOString(),
    windowDimensions: typeof window !== 'undefined' ? 
      `${window.innerWidth}x${window.innerHeight}` : 'N/A',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
  });

  useEffect(() => {
    console.log('[SCMS] Root layout mounted');
    console.log('[SCMS] Environment:', process.env.NODE_ENV);
    
    // Log when components mount
    return () => console.log('[SCMS] Root layout unmounted');
  }, []);

  // Only show in development or with debug flag
  if (process.env.NODE_ENV !== 'development' && 
      typeof window !== 'undefined' && 
      !window.location.search.includes('debug=true')) {
    return null;
  }

  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugText}>SCMS Debug Info</Text>
      <Text style={styles.debugText}>Load Time: {info.loadTime}</Text>
      <Text style={styles.debugText}>Dimensions: {info.windowDimensions}</Text>
      <Text style={styles.debugText}>User Agent: {info.userAgent.substring(0, 50)}...</Text>
    </View>
  );
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    console.log('[SCMS] RootLayout rendered with colorScheme:', colorScheme);
  }, [colorScheme]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      <DebugInfo />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  debugContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    zIndex: 9999,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
  }
});
