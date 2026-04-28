import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import ErrorBoundary from './components/ErrorBoundary';
// Import Firebase configuration
import './src/config/firebase';

export default function App() {
  useEffect(() => {
    console.log('[SCMS] App component mounted');
    console.log('[SCMS] Platform:', Platform.OS);
    console.log('[SCMS] User Agent:', navigator.userAgent);
    
    // Set platform header for web with iPad detection
    if (Platform.OS === 'web') {
      // Detect if it's actually an iPad in Safari (which reports as macOS)
      const isIPad = navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || isIPad;
      
      let platform = 'web';
      if (isIOS) {
        platform = 'ios';
      } else if (/Android/.test(navigator.userAgent)) {
        platform = 'android';
      }
      
      document.documentElement.setAttribute('data-platform', platform);
      
      // Add platform detection meta tag
      const meta = document.createElement('meta');
      meta.name = 'expo-platform';
      meta.content = platform;
      document.head.appendChild(meta);
      
      console.log('[SCMS] Platform detected as:', platform, 'isIPad:', isIPad);
    }
    
    // Log performance metrics
    if (typeof performance !== 'undefined') {
      setTimeout(() => {
        const navTiming = performance.getEntriesByType('navigation')[0];
        if (navTiming) {
          console.log('[SCMS Performance]', {
            loadTime: navTiming.loadEventEnd - navTiming.startTime,
            domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.startTime,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 'N/A'
          });
        }
      }, 1000);
    }
    
    return () => console.log('[SCMS] App component unmounted');
  }, []);
  
  return (
    <ErrorBoundary>
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}