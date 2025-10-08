import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the landing page instead of student portal
  return <Redirect href="/landing" />;
}