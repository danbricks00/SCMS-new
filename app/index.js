import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';

export default function Index() {
  // Add client-side detection
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Mark as mounted after initial render
    setMounted(true);
    console.log('[SCMS] Index component mounted');
    console.log('[SCMS] Redirecting to /landing');
    
    // Log any potential errors
    const originalError = console.error;
    console.error = (...args) => {
      console.log('[SCMS ERROR]', ...args);
      originalError.apply(console, args);
    };
    
    return () => {
      console.log('[SCMS] Index component unmounted');
      console.error = originalError;
    };
  }, []);
  
  // Always redirect, but with a fallback for SSR
  return <Redirect href="/landing" />;
}