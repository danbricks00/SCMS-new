import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DebugOverlay = ({ deviceInfo, visible = false, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      addLog('LOG', args.join(' '));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('ERROR', args.join(' '));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('WARN', args.join(' '));
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-50), { type, message, timestamp }]);
  };

  if (!visible) return null;

  if (isMinimized) {
    return (
      <TouchableOpacity 
        style={styles.minimizedButton}
        onPress={() => setIsMinimized(false)}
      >
        <Ionicons name="bug" size={24} color="#fff" />
        <Text style={styles.minimizedText}>Debug ({logs.length})</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bug" size={20} color="#fff" />
          <Text style={styles.headerTitle}>Debug Console</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setIsMinimized(true)}
          >
            <Ionicons name="remove" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setLogs([])}
          >
            <Ionicons name="trash" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Device Info Section */}
      {deviceInfo && (
        <View style={styles.deviceInfoSection}>
          <Text style={styles.sectionTitle}>📱 Device Detection:</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User Agent:</Text>
            <Text style={styles.infoValue} numberOfLines={3}>
              {deviceInfo.userAgent?.substring(0, 100)}...
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>{deviceInfo.platform}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Touch Points:</Text>
            <Text style={styles.infoValue}>{deviceInfo.touchPoints}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Is Mobile:</Text>
            <Text style={[styles.infoValue, deviceInfo.isMobile ? styles.success : styles.error]}>
              {deviceInfo.isMobile ? '✅ TRUE' : '❌ FALSE'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Is Desktop:</Text>
            <Text style={[styles.infoValue, !deviceInfo.isDesktop ? styles.success : styles.error]}>
              {deviceInfo.isDesktop ? '❌ TRUE' : '✅ FALSE'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Screen Width:</Text>
            <Text style={styles.infoValue}>{deviceInfo.screenWidth}px</Text>
          </View>
        </View>
      )}

      {/* Console Logs Section */}
      <View style={styles.logsSection}>
        <Text style={styles.sectionTitle}>📋 Console Logs:</Text>
        <ScrollView style={styles.logsScroll}>
          {logs.length === 0 ? (
            <Text style={styles.noLogs}>No logs yet. Interact with the app to see logs.</Text>
          ) : (
            logs.map((log, index) => (
              <View key={index} style={styles.logEntry}>
                <Text style={styles.logTime}>{log.timestamp}</Text>
                <Text style={[
                  styles.logMessage,
                  log.type === 'ERROR' && styles.logError,
                  log.type === 'WARN' && styles.logWarn
                ]}>
                  {log.type === 'ERROR' && '❌ '}
                  {log.type === 'WARN' && '⚠️ '}
                  {log.type === 'LOG' && '📝 '}
                  {log.message}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          💡 Copy these values to share for debugging
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    padding: 5,
  },
  deviceInfoSection: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    maxHeight: '35%',
  },
  sectionTitle: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  infoLabel: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 100,
  },
  infoValue: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  success: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  error: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  logsSection: {
    flex: 1,
    padding: 15,
  },
  logsScroll: {
    flex: 1,
  },
  noLogs: {
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  logEntry: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logTime: {
    color: '#666',
    fontSize: 10,
    marginBottom: 4,
  },
  logMessage: {
    color: '#e0e0e0',
    fontSize: 12,
    lineHeight: 18,
  },
  logError: {
    color: '#ff6b6b',
  },
  logWarn: {
    color: '#FF9800',
  },
  instructions: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  instructionsText: {
    color: '#4a90e2',
    fontSize: 11,
    textAlign: 'center',
  },
  minimizedButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4a90e2',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  minimizedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DebugOverlay;

