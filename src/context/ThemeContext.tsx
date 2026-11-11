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

  const [crextioConfig, setCrextioConfig] = useState<CrextioDashboardConfig>(DEFAULT_CREXTIO_CONFIG);
  const [mizanConfig, setMizanConfig] = useState<MizanDashboardConfig>(DEFAULT_MIZAN_CONFIG);

  useEffect(() => {
    let isMounted = true;
    api.getThemeConfig().then(res => {
      if (!isMounted || !res) return;
      if (res.crextio) {
        setCrextioConfig(prev => ({ ...prev, ...res.crextio, _baseVersion: res.version || 1 }));
      }
      if (res.mizan) {
        setMizanConfig(prev => ({ ...prev, ...res.mizan }));
      }
    }).catch(() => {});

    const unsubscribe = api.subscribeToEvents(event => {
      if (event.type === 'admin.theme_updated' || event.type === 'admin.dashboard_config_updated') {
        const payload = event.data?.data?.updates || event.data?.data || event.data;
        const config = payload?.config || payload;
        if (config) {
          if (config.crextio || config.mizan) {
            if (config.crextio) setCrextioConfig(prev => ({ ...prev, ...config.crextio, _baseVersion: event.data?.data?.version || (prev as any)._baseVersion }));
            if (config.mizan) setMizanConfig(prev => ({ ...prev, ...config.mizan }));
          } else if (typeof config === 'object') {
            setCrextioConfig(prev => ({ ...prev, ...config, _baseVersion: event.data?.data?.version || (prev as any)._baseVersion }));
          }
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const updateCrextioConfig = useCallback((updates: Partial<CrextioDashboardConfig>) => {
    setCrextioConfig(prev => {
      const next = { ...prev, ...updates };
      api.saveThemeConfig({
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
    api.saveThemeConfig(DEFAULT_CREXTIO_CONFIG).catch(() => {});
  }, []);

  const updateMizanConfig = useCallback((updates: Partial<MizanDashboardConfig>) => {
    setMizanConfig(prev => {
      const next = { ...prev, ...updates };
      api.saveThemeConfig(next).catch(() => {});
      return next;
    });
  }, []);

  const resetMizanConfig = useCallback(() => {
    setMizanConfig(DEFAULT_MIZAN_CONFIG);
  }, []);

  const [designTheme, setDesignThemeState] = useState<'portal' | 'crextio'>('crextio');

  const setDesignTheme = useCallback((newTheme: 'portal' | 'crextio') => {
    setDesignThemeState(newTheme);
  }, []);

  const toggleDesignTheme = useCallback(() => {
    setDesignThemeState(prev => (prev === 'crextio' ? 'portal' : 'crextio'));
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
