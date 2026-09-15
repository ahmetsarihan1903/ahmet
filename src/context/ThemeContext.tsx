import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
export type FontScale = 100 | 110 | 120 | 130 | 140;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  fontScale: number;
  setFontScale: (scale: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'beta_asansor_theme_v1';
const FONT_SCALE_STORAGE_KEY = 'beta_asansor_font_scale_v1';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark'; // default to dark theme for elevator shafts/kuyu ortamı
  });

  const [fontScale, setFontScaleState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 100 && parsed <= 140) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return 100; // Standart / Mevcut Punto (Min Başlangıç)
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (fontScale <= 100) {
      root.style.fontSize = '100%';
      root.style.setProperty('--app-font-scale', '1');
    } else {
      root.style.fontSize = `${fontScale}%`;
      root.style.setProperty('--app-font-scale', `${fontScale / 100}`);
    }

    try {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, fontScale.toString());
    } catch {
      // ignore
    }
  }, [fontScale]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setFontScale = (newScale: number) => {
    // Min 100% (Mevcut Punto), Max 140%
    const clamped = Math.min(140, Math.max(100, Math.round(newScale)));
    setFontScaleState(clamped);
  };

  const increaseFontSize = () => {
    setFontScaleState((prev) => Math.min(140, prev + 10));
  };

  const decreaseFontSize = () => {
    setFontScaleState((prev) => Math.max(100, prev - 10));
  };

  const resetFontSize = () => {
    setFontScaleState(100);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isDark: theme === 'dark',
        fontScale,
        setFontScale,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
