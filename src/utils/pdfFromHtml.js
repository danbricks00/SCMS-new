import { Platform } from 'react-native';

const PDF_API_PATH = '/api/pdf-from-html';

/**
 * Whether the deployed app can call the Vercel PDF proxy (web only).
 */
export function canUseServerPdf() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && !!window.location?.origin;
}

/**
 * Calls the same-origin `/api/pdf-from-html` route (API2PDF key on server).
 * @returns {Promise<string>} Temporary PDF URL from API2PDF
 */
export async function generatePdfUrlFromHtml(html) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const res = await fetch(`${origin}${PDF_API_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || data.hint || `PDF service error (${res.status})`;
    throw new Error(msg);
  }
  const url = data.fileUrl || data.FileUrl;
  if (!url) {
    throw new Error('PDF URL missing from response');
  }
  return url;
}

/** Last resort on web when the API is unavailable (e.g. local Expo without `vercel dev`). */
export function openPrintDialogWithHtml(html) {
  if (typeof window === 'undefined') return;
  const w = window.open('', '_blank');
  if (!w) {
    window.alert('Allow pop-ups to print, or deploy to Vercel with API2PDF configured.');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();

  const triggerPrint = () => {
    try {
      w.print();
    } catch (e) {
      console.warn('[openPrintDialogWithHtml] print() failed:', e);
    }
  };

  const schedulePrint = () => {
    const imgs = w.document.querySelectorAll('img');
    if (!imgs.length) {
      setTimeout(triggerPrint, 150);
      return;
    }
    let pending = imgs.length;
    const onImageReady = () => {
      pending -= 1;
      if (pending <= 0) {
        setTimeout(triggerPrint, 100);
      }
    };
    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        onImageReady();
      } else {
        img.addEventListener('load', onImageReady, { once: true });
        img.addEventListener('error', onImageReady, { once: true });
      }
    });
    setTimeout(triggerPrint, 2000);
  };

  w.addEventListener('load', () => setTimeout(schedulePrint, 50));
  setTimeout(schedulePrint, 400);
}
