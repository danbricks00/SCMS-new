/**
 * NFC prep layer — full tap-to-attendance will build on this.
 * @see src/nfc/index.ts for stack / modules.
 */

export type NfcPrepareFailureReason =
  | 'web'
  | 'unsupported'
  | 'module'
  | 'error';

export type NfcPrepareResult =
  | { ok: true; supported: true }
  | {
      ok: false;
      supported: false;
      reason: NfcPrepareFailureReason;
      /** User-facing message */
      message: string;
    };
