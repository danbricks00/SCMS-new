import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [colorSchemeValue, setColorSchemeValue] = useState('light');

  useEffect(() => {
    setHasHydrated(true);
    const scheme = useRNColorScheme();
    setColorSchemeValue(scheme || 'light');
  }, []);

  return hasHydrated ? colorSchemeValue : 'light';
}
