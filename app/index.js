import { Redirect } from 'expo-router';
import React from 'react';

export default function Index() {
  // Redirect to an existing route
  return <Redirect href="/student" />;
}