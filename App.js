import { ExpoRoot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

// Immediate logging to check if the file is being loaded
console.log('[SCMS] App.js file loaded');

export default function App() {
  useEffect(() => {
    console.log('[SCMS] App component mounted');
    
    // Enhanced error logging
    const originalError = console.error;
    console.error = (...args) => {
      console.log('[SCMS APP ERROR]', ...args);
      originalError.apply(console, args);
    };
    
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
    
    return () => {
      console.log('[SCMS] App component unmounted');
      console.error = originalError;
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <ExpoRoot context={require.context('./app')} />
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}