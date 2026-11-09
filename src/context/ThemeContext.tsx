import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CrextioDashboardConfig, MizanDashboardConfig } from '../types';
import { DEFAULT_CREXTIO_CONFIG, DEFAULT_MIZAN_CONFIG } from '../data/mockData';
import { api } from '../services/apiClient';

const STORAGE_KEY_PREFIX = 'feqh_portal_v3_';

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  designTheme: 'portal' | 'crextio';
  setDesignTheme: (theme: 'portal' | 'crextio') => void;
  toggleDesignTheme: () => void;
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  resetCrextioConfig: () => void;
  mizanConfig: MizanDashboardConfig;
  updateMizanConfig: (updates: Partial<MizanDashboardConfig>) => void;
  resetMizanConfig: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}theme`);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}theme`, next);
      }
      return next;
    });
  }, []);

  const [crextioConfig, setCrextioConfig] = useState<CrextioDashboardConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}crextio_config`);
      if (saved) {
        try {
          return { ...DEFAULT_CREXTIO_CONFIG, ...JSON.parse(saved) };
        } catch {}
      }
    }
    return DEFAULT_CREXTIO_CONFIG;
  });

  const updateCrextioConfig = useCallback((updates: Partial<CrextioDashboardConfig>) => {
    setCrextioConfig(prev => {
      const next = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}crextio_config`, JSON.stringify(next));
      }
      // Persist to backend / MySQL 8 database
      api.saveDashboardConfig({
        ...next,
        _baseVersion: (prev as any)._baseVersion || 1,
      }).then(res => {
        if (res && res.version) {
          setCrextioConfig(curr => ({ ...curr, _baseVersion: res.version }));
        }
      }).catch(() => {});
      return next;
    });
  }, []);

  const resetCrextioConfig = useCallback(() => {
    setCrextioConfig(DEFAULT_CREXTIO_CONFIG);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}crextio_config`);
    }
  }, []);

  const [mizanConfig, setMizanConfig] = useState<MizanDashboardConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}mizan_config`);
      if (saved) {
        try {
          return { ...DEFAULT_MIZAN_CONFIG, ...JSON.parse(saved) };
        } catch {}
      }
    }
    return DEFAULT_MIZAN_CONFIG;
  });

  const updateMizanConfig = useCallback((updates: Partial<MizanDashboardConfig>) => {
    setMizanConfig(prev => {
      const next = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}mizan_config`, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const resetMizanConfig = useCallback(() => {
    setMizanConfig(DEFAULT_MIZAN_CONFIG);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}mizan_config`);
    }
  }, []);

  const [designTheme, setDesignThemeState] = useState<'portal' | 'crextio'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}design_theme`);
      if (saved === 'portal' || saved === 'crextio') return saved;
    }
    return 'crextio';
  });

  const setDesignTheme = useCallback((newTheme: 'portal' | 'crextio') => {
    setDesignThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}design_theme`, newTheme);
    }
  }, []);

  const toggleDesignTheme = useCallback(() => {
    setDesignThemeState(prev => {
      const next = prev === 'crextio' ? 'portal' : 'crextio';
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}design_theme`, next);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const value = useMemo<ThemeContextType>(() => ({
    theme,
    toggleTheme,
    designTheme,
    setDesignTheme,
    toggleDesignTheme,
    crextioConfig,
    updateCrextioConfig,
    resetCrextioConfig,
    mizanConfig,
    updateMizanConfig,
    resetMizanConfig,
  }), [
    theme,
    toggleTheme,
    designTheme,
    setDesignTheme,
    toggleDesignTheme,
    crextioConfig,
    updateCrextioConfig,
    resetCrextioConfig,
    mizanConfig,
    updateMizanConfig,
    resetMizanConfig,
  ]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
