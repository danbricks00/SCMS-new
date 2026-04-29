import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { prepareNfc, shutdownNfcPrep, type NfcPrepareResult } from '../src/nfc';

export default function NfcKioskScreen() {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [result, setResult] = useState<NfcPrepareResult | null>(null);

  const runPrepare = useCallback(async () => {
    setPhase('loading');
    const r = await prepareNfc();
    setResult(r);
    if (r.ok) {
      setPhase('ready');
    } else {
      setPhase('fallback');
    }
  }, []);

  useEffect(() => {
    runPrepare();
    return () => {
      shutdownNfcPrep().catch(() => {});
    };
  }, [runPrepare]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/teacher');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>NFC kiosk (prep)</Text>
          <View style={styles.headerSpacer} />
        </View>

        {phase === 'loading' && (
          <View style={styles.card}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.muted}>Checking NFC…</Text>
          </View>
        )}

        {phase === 'ready' && result?.ok && (
          <View style={[styles.card, styles.okCard]}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            <Text style={styles.heading}>NFC is available</Text>
            <Text style={styles.body}>
              This device can use NFC for attendance in a future update. Tap-to-check-in is not wired yet — use QR
              scanning for now.
            </Text>
            <Text style={styles.platformNote}>
              {Platform.OS === 'web' ? 'Web' : 'Native'} · {Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Other'}
            </Text>
          </View>
        )}

        {phase === 'fallback' && result && !result.ok && (
          <View style={[styles.card, styles.warnCard]}>
            <Ionicons name="qr-code" size={48} color="#e65100" />
            <Text style={styles.heading}>QR code fallback needed</Text>
            <Text style={styles.body}>
              NFC is not available or could not be started on this device or build. Use the teacher QR scanner (Check
              In / Check Out) instead.
            </Text>
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Details</Text>
              <Text style={styles.reasonText}>{result.message}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={goBack}>
          <Text style={styles.primaryBtnText}>Back to portal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={runPrepare}>
          <Text style={styles.secondaryBtnText}>Try NFC again</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: { padding: 8, marginRight: 8 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#333' },
  headerSpacer: { width: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  okCard: { borderColor: '#c8e6c9' },
  warnCard: { borderColor: '#ffcc80' },
  heading: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 12, textAlign: 'center' },
  body: { fontSize: 15, color: '#555', marginTop: 10, textAlign: 'center', lineHeight: 22 },
  muted: { marginTop: 12, color: '#888', fontSize: 14 },
  platformNote: { marginTop: 16, fontSize: 12, color: '#999' },
  reasonBox: {
    marginTop: 16,
    alignSelf: 'stretch',
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
  },
  reasonLabel: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 4 },
  reasonText: { fontSize: 13, color: '#444', lineHeight: 18 },
  primaryBtn: {
    backgroundColor: '#4a90e2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: { paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#4a90e2', fontSize: 15, fontWeight: '600' },
});
