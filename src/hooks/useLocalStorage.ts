"use client";

import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

function generateAnonymousId(): string {
 return uuidv4();
}

function getAnonymousId(): string {
 const id = localStorage.getItem('anonymousUserId');
 if (id) return id;
 const newId = generateAnonymousId();
 localStorage.setItem('anonymousUserId', newId);
 return newId;
}

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // Initialize state with initialValue to ensure server and client match on first render.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Effect to read from localStorage and update state after component has mounted.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item) as T);
        }
        // If item is null, storedValue remains initialValue, which is correct.
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}" during mount:`, error);
        // Value remains initialValue
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only run on mount (and if key changes, though it shouldn't typically)

  const setValue: SetValue<T> = useCallback(
    value => {
      if (typeof window === 'undefined') {
        console.warn(
          `Tried setting localStorage key "${key}" even though environment is not a client`
        );
        return;
      }

      try {
        // Allow value to be a function so we have the same API as useState
        const newValue = value instanceof Function ? value(storedValue) : value;
        window.localStorage.setItem(key, JSON.stringify(newValue));
        setStoredValue(newValue);
        // Dispatch a custom event to notify other instances of this hook,
        // or other parts of the app that might care about localStorage changes.
        window.dispatchEvent(new Event("local-storage"));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Effect for cross-tab/window synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue) {
          try {
            setStoredValue(JSON.parse(event.newValue));
          } catch (error) {
            console.warn(`Error parsing localStorage update for key "${key}" from storage event:`, error);
            setStoredValue(initialValue); // Fallback to initialValue on parse error
          }
        } else {
          // newValue is null if the item was removed or cleared
          setStoredValue(initialValue);
        }
      }
    };

    // Handles the custom event dispatched by setValue within the same browser context
    const handleCustomEvent = (event: Event) => {
      // Check if the event is our specific local-storage event if more detail is needed,
      // but for now, simply re-reading the value is robust.
      if (typeof window !== 'undefined') {
        try {
          const item = window.localStorage.getItem(key);
          setStoredValue(item ? JSON.parse(item) : initialValue);
        } catch (error) {
          console.warn(`Error reading localStorage key "${key}" on custom event:`, error);
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage", handleCustomEvent);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;

// ** Add this line to export getAnonymousId as a named export **
export { getAnonymousId };
