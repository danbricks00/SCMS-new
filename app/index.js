import React from 'react';
import { Redirect } from 'expo-router';

console.log('[SCMS] Index.js loaded directly');

export default function Index() {
  console.log('[SCMS] Index component rendering');
  return <Redirect href="/landing" />;
}