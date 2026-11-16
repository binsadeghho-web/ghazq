import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CrextioDashboardConfig, MizanDashboardConfig, DesignThemeType } from '../types';
import { DEFAULT_CREXTIO_CONFIG, DEFAULT_MIZAN_CONFIG } from '../data/mockData';
import { api } from '../services/apiClient';

const STORAGE_KEY_PREFIX = 'feqh_portal_v3_';

export const CANONICAL_DASHBOARD_SECTION_ORDER = [
  'top_vip_row',
  'rulings_showcase',
  'research_promo',
  'course_showcase',
  'counseling_promo',
  'welfare_showcase',
  'multimedia_showcase',
  'bento_grid',
  'books_showcase',
];

/**
 * Ensures new or accidentally dropped showcase sections (such as 'research_promo' or 'rulings_showcase')
 * are automatically reconciled into saved sectionOrder arrays without clobbering admin's custom order.
 */
export function reconcileDashboardSectionOrder(savedOrder?: string[]): string[] {
  if (!Array.isArray(savedOrder) || savedOrder.length === 0) {
    return [...CANONICAL_DASHBOARD_SECTION_ORDER];
  }
  const merged = [...savedOrder];
  CANONICAL_DASHBOARD_SECTION_ORDER.forEach((key, canonicalIdx) => {
    if (!merged.includes(key)) {
      // Insert right after the previous canonical item if present, or near its natural index
      const prevCanonical = canonicalIdx > 0 ? CANONICAL_DASHBOARD_SECTION_ORDER[canonicalIdx - 1] : null;
      const prevPos = prevCanonical ? merged.indexOf(prevCanonical) : -1;
      if (prevPos !== -1) {
        merged.splice(prevPos + 1, 0, key);
      } else {
        merged.splice(Math.min(canonicalIdx, merged.length), 0, key);
      }
    }
  });
  return merged;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  designTheme: DesignThemeType;
  setDesignTheme: (theme: DesignThemeType) => void;
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

  const applyCrextioConfigPayload = useCallback((incoming: Partial<CrextioDashboardConfig>, version?: number) => {
    setCrextioConfig(prev => {
      const reconciledOrder = reconcileDashboardSectionOrder(incoming.dashboardSectionOrder ?? prev.dashboardSectionOrder);
      return {
        ...prev,
        ...incoming,
        dashboardSectionOrder: reconciledOrder,
        showResearchPromoShowcase: incoming.showResearchPromoShowcase !== undefined ? incoming.showResearchPromoShowcase : (prev.showResearchPromoShowcase ?? true),
        ...(version ? { _baseVersion: version } : {}),
      };
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    api.getThemeConfig().then(res => {
      if (!isMounted || !res) return;
      if (res.crextio) {
        applyCrextioConfigPayload(res.crextio, res.version || 1);
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
            if (config.crextio) applyCrextioConfigPayload(config.crextio, event.data?.data?.version);
            if (config.mizan) setMizanConfig(prev => ({ ...prev, ...config.mizan }));
          } else if (typeof config === 'object') {
            applyCrextioConfigPayload(config, event.data?.data?.version);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [applyCrextioConfigPayload]);

  const updateCrextioConfig = useCallback((updates: Partial<CrextioDashboardConfig>) => {
    setCrextioConfig(prev => {
      const next = {
        ...prev,
        ...updates,
        dashboardSectionOrder: reconcileDashboardSectionOrder(updates.dashboardSectionOrder ?? prev.dashboardSectionOrder),
      };
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

  const [designTheme, setDesignThemeState] = useState<DesignThemeType>('crextio');

  const setDesignTheme = useCallback((newTheme: DesignThemeType) => {
    setDesignThemeState(newTheme);
  }, []);

  const toggleDesignTheme = useCallback(() => {
    setDesignThemeState(prev => {
      if (prev === 'portal') return 'crextio';
      if (prev === 'crextio') return 'minimal';
      return 'portal';
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
