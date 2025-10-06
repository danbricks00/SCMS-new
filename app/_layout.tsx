import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Debug component to show loading status
const DebugInfo = () => {
  // Use state to track client-side rendering
  const [mounted, setMounted] = useState(false);
  const [info, setInfo] = React.useState({
    loadTime: '',
    windowDimensions: 'Loading...',
    userAgent: 'Loading...'
  });

  useEffect(() => {
    // Mark as mounted to prevent hydration mismatch
    setMounted(true);
    
    // Only run on client-side after component is mounted
    if (typeof window !== 'undefined') {
      setInfo({
        loadTime: new Date().toISOString(),
        windowDimensions: `${window.innerWidth} ${window.innerHeight}`,
        userAgent: navigator.userAgent
      });
      
      console.log('[SCMS] Root layout mounted');
      console.log('[SCMS] Environment:', process.env.NODE_ENV);
      console.log('[SCMS] Platform:', process.env.EXPO_OS || 'unknown');
    }
    
    return () => console.log('[SCMS] Root layout unmounted');
  }, []);

  // Only render when mounted (client-side)
  if (!mounted) return null;
  
  // Always show in development and production for debugging
  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugText}>SCMS Debug Info</Text>
      <Text style={styles.debugText}>Load Time: {info.loadTime}</Text>
      <Text style={styles.debugText}>Dimensions: {info.windowDimensions}</Text>
      <Text style={styles.debugText}>User Agent: {info.userAgent && info.userAgent.substring(0, 50)}...</Text>
    </View>
  );
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Track client-side rendering
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted after initial render
    setMounted(true);
    console.log('[SCMS] RootLayout rendered with colorScheme:', colorScheme);
  }, [colorScheme]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack screenOptions={{ headerShown: false }}>
          {/* The modal screen will be presented modally */}
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          {/* All other routes like landing.js, student.js will be discovered automatically */}
        </Stack>
      </Stack>
      <StatusBar style="auto" />
      {/* Only render debug info on client-side */}
      {mounted && <DebugInfo />}
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
