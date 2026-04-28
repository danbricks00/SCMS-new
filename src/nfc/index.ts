/**
 * NFC preparation layer (kiosk groundwork)
 * ================================
 * Planned / installed stack:
 *
 * - **react-native-nfc-manager** (^3.x) — read/write NFC, NDEF, tech types (Android + iOS native).
 * - **Expo config plugin** — `react-native-nfc-manager` in app.json adds:
 *   - Android: `android.permission.NFC`
 *   - iOS: `NFCReaderUsageDescription`, NFC reader entitlements (NDEF/TAG)
 * - **expo-dev-client** — custom native builds (NFC does not run in Expo Go).
 * - **QR path** — unchanged; universal fallback when NFC is unavailable (web, old phones, iOS browser).
 *
 * Next steps (not implemented here): class session id, NDEF payload format, `registerTagEvent` → attendance API.
 */

export type { NfcPrepareFailureReason, NfcPrepareResult } from './types';
export { prepareNfc, shutdownNfcPrep } from './nfcAdapter';
