
"use client";

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  const setValue: SetValue<T> = useCallback(value => {
    if (typeof window === 'undefined') {
      console.warn(
        `Tried setting localStorage key "${key}" even though environment is not a client`
      );
      return;
    }

    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      window.localStorage.setItem(key, JSON.stringify(newValue));
      setStoredValue(newValue);
      window.dispatchEvent(new Event("local-storage"));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);


  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        setStoredValue(readValue());
      }
    };
    const handleCustomEvent = () => {
        setStoredValue(readValue());
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage", handleCustomEvent);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage", handleCustomEvent);
    };
  }, [key, readValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
