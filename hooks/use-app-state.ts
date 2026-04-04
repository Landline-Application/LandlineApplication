import { useEffect, useState } from 'react';

import { AppState, AppStateStatus } from 'react-native';

/**
 * Custom hook to track the application state (active, background, inactive).
 */
export function useAppState() {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return appState;
}
