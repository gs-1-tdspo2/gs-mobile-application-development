import { useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Fires `callback` every `intervalMs` ms while the screen is focused.
 * Stops automatically when the screen loses focus or unmounts.
 * Does not stack: only one interval runs at a time.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number = 10_000,
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  });

  useFocusEffect(
    useCallback(() => {
      const id = setInterval(() => void savedCallback.current(), intervalMs);
      return () => clearInterval(id);
    }, [intervalMs]),
  );
}
