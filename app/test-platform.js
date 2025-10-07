import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TestPlatform() {
  const [platformInfo, setPlatformInfo] = useState({});

  useEffect(() => {
    // Detect iPad Safari specifically
    const isIPad = Platform.OS === 'web' && 
      navigator.maxTouchPoints && 
      navigator.maxTouchPoints > 2 && 
      /MacIntel/.test(navigator.platform);
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || isIPad;
    
    setPlatformInfo({
      platformOS: Platform.OS,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
      isIPad: isIPad,
      isIOS: isIOS,
      detectedPlatform: isIOS ? 'ios' : Platform.OS === 'web' ? 'web' : Platform.OS
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Platform Detection Test</Text>
        
        <View style={styles.infoSection}>
          <Text style={styles.label}>Platform.OS:</Text>
          <Text style={styles.value}>{platformInfo.platformOS}</Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.label}>Detected Platform:</Text>
          <Text style={styles.value}>{platformInfo.detectedPlatform}</Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.label}>Is iPad:</Text>
          <Text style={styles.value}>{platformInfo.isIPad ? 'Yes' : 'No'}</Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.label}>Is iOS:</Text>
          <Text style={styles.value}>{platformInfo.isIOS ? 'Yes' : 'No'}</Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.label}>Max Touch Points:</Text>
          <Text style={styles.value}>{platformInfo.maxTouchPoints}</Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.label}>Navigator Platform:</Text>
          <Text style={styles.value}>{platformInfo.platform}</Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.label}>User Agent:</Text>
          <Text style={styles.userAgent}>{platformInfo.userAgent}</Text>
        </View>
        
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>Status:</Text>
          <Text style={[
            styles.statusText, 
            platformInfo.detectedPlatform === 'ios' ? styles.success : styles.error
          ]}>
            {platformInfo.detectedPlatform === 'ios' ? '✅ iOS Detected' : '❌ Not iOS'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  infoSection: {
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: '#666',
  },
  userAgent: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  statusSection: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#F44336',
  },
});
