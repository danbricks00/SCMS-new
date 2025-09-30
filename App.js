import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  useEffect(() => {
    console.log('[SCMS] App component mounted');
    
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