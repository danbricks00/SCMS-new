import { Redirect } from 'expo-router';
import React, { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
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
  
  // Redirect to the landing page instead of student portal
  return <Redirect href="/landing" />;
}