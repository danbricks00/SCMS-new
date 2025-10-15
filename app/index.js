import { Redirect } from "expo-router";
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

export default function App() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    console.log("App component mounted on the client.");

    return () => {
      console.log("App component will unmount.");
    };
  }, []);

  if (!isClient) {
    return null; // Return null or a loading indicator
  }

  try {
    return <Redirect href="/login" />;
  } catch (error) {
    console.error("Error during redirect:", error);
    // In a real app, you might want to show a proper error screen
    return <Text>Error loading the application.</Text>;
  }
}