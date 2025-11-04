// Theme management provider and hook
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './theme';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = '@app_theme_mode';

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: typeof lightColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load theme preference from storage
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((value) => {
        if (value === 'light' || value === 'dark') {
          setThemeModeState(value);
        }
        setIsLoaded(true);
      })
      .catch(() => {
        setIsLoaded(true);
      });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const colors = themeMode === 'dark' ? darkColors : lightColors;

  // Don't render children until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ themeMode, colors, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

