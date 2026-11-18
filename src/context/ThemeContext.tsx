import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CrextioDashboardConfig, MizanDashboardConfig, DesignThemeType } from '../types';
import { DEFAULT_CREXTIO_CONFIG, DEFAULT_MIZAN_CONFIG } from '../data/mockData';
import { api } from '../services/apiClient';

const STORAGE_KEY_PREFIX = 'feqh_portal_v3_';

export const CANONICAL_DASHBOARD_SECTION_ORDER = [
  'dashboard_banners',
  'status_widget',
  'events_calendar',
  'top_vip_row',
  'honors_showcase',
  'unified_showcase',
  'rulings_showcase',
  'research_promo',
  'course_showcase',
  'counseling_promo',
  'counseling_general_showcase',
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
  isAlumniPreview: boolean;
  setIsAlumniPreview: React.Dispatch<React.SetStateAction<boolean>>;
  toggleAlumniPreview: () => void;
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
  const crextioVersionRef = React.useRef<number>(1);
  const mizanVersionRef = React.useRef<number>(1);
  const crextioStateRef = React.useRef<CrextioDashboardConfig>(DEFAULT_CREXTIO_CONFIG);
  const mizanStateRef = React.useRef<MizanDashboardConfig>(DEFAULT_MIZAN_CONFIG);

  const applyCrextioConfigPayload = useCallback((incoming: Partial<CrextioDashboardConfig>, version?: number) => {
    setCrextioConfig(prev => {
      const reconciledOrder = reconcileDashboardSectionOrder(incoming.dashboardSectionOrder ?? prev.dashboardSectionOrder);
      const next: CrextioDashboardConfig = {
        ...DEFAULT_CREXTIO_CONFIG,
        ...prev,
        ...incoming,
        theme3Config: {
          ...(DEFAULT_CREXTIO_CONFIG.theme3Config || {}),
          ...(prev.theme3Config || {}),
          ...(incoming.theme3Config || {}),
        },
        dashboardSectionOrder: reconciledOrder,
        showResearchPromoShowcase:
          incoming.showResearchPromoShowcase !== undefined
            ? incoming.showResearchPromoShowcase
            : (prev.showResearchPromoShowcase ?? true),
        ...(version ? { _baseVersion: version } : {}),
      };
      crextioStateRef.current = next;
      if (version) crextioVersionRef.current = Number(version);
      return next;
    });
  }, []);

  const applyMizanConfigPayload = useCallback((incoming: Partial<MizanDashboardConfig>, version?: number) => {
    setMizanConfig(prev => {
      const next: MizanDashboardConfig = {
        ...DEFAULT_MIZAN_CONFIG,
        ...prev,
        ...incoming,
      };
      mizanStateRef.current = next;
      if (version) mizanVersionRef.current = Number(version);
      return next;
    });
  }, []);

  const refreshDashboardConfig = useCallback(async () => {
    try {
      const res: any = await api.getThemeConfig();
      if (!res) return;
      if (res.crextio) {
        applyCrextioConfigPayload(res.crextio, res.version || 1);
      }
      if (res.mizan) {
        applyMizanConfigPayload(res.mizan, res.mizanVersion || 1);
      }
    } catch {}
  }, [applyCrextioConfigPayload, applyMizanConfigPayload]);

  useEffect(() => {
    refreshDashboardConfig();

    const handleAuthOrRoleSync = () => {
      refreshDashboardConfig();
    };
    window.addEventListener('app:auth_changed', handleAuthOrRoleSync);
    window.addEventListener('app:role_switched', handleAuthOrRoleSync);

    const unsubscribe = api.subscribeToEvents(event => {
      if (event.type === 'admin.theme_updated' || event.type === 'admin.dashboard_config_updated') {
        const envelope = event.data?.data?.updates || event.data?.data || event.data;
        const ver = event.data?.data?.version || envelope?.version;
        const target = envelope?.target;
        const config = envelope?.config || envelope;

        if (config && typeof config === 'object') {
          if (target === 'mizan' || (config.mizan && !config.crextio)) {
            const mizanPayload = config.mizan || envelope?.mizan || config;
            applyMizanConfigPayload(mizanPayload, ver);
          } else if (config.crextio || config.mizan) {
            if (config.crextio) applyCrextioConfigPayload(config.crextio, ver);
            if (config.mizan) applyMizanConfigPayload(config.mizan, ver);
          } else {
            applyCrextioConfigPayload(config, ver);
          }
        }
      }
    });

    return () => {
      window.removeEventListener('app:auth_changed', handleAuthOrRoleSync);
      window.removeEventListener('app:role_switched', handleAuthOrRoleSync);
      unsubscribe();
    };
  }, [refreshDashboardConfig, applyCrextioConfigPayload, applyMizanConfigPayload]);

  const updateCrextioConfig = useCallback((updates: Partial<CrextioDashboardConfig>) => {
    const prev = crextioStateRef.current;
    const next: CrextioDashboardConfig = {
      ...prev,
      ...updates,
      dashboardSectionOrder: reconcileDashboardSectionOrder(updates.dashboardSectionOrder ?? prev.dashboardSectionOrder),
    };
    crextioStateRef.current = next;
    setCrextioConfig(next);

    const baseVer = crextioVersionRef.current || (prev as any)._baseVersion || 1;
    api.saveThemeConfig({
      _target: 'crextio',
      _baseVersion: baseVer,
      config: next,
    }).then(res => {
      if (res?.version) {
        crextioVersionRef.current = Number(res.version);
        setCrextioConfig(curr => {
          const updated = { ...curr, _baseVersion: res.version };
          crextioStateRef.current = updated;
          return updated;
        });
      }
    }).catch(() => {});
  }, []);

  const resetCrextioConfig = useCallback(() => {
    const baseVer = crextioVersionRef.current || 1;
    const next: CrextioDashboardConfig = {
      ...DEFAULT_CREXTIO_CONFIG,
      _baseVersion: baseVer,
    };
    crextioStateRef.current = next;
    setCrextioConfig(next);
    api.saveThemeConfig({
      _target: 'crextio',
      _baseVersion: baseVer,
      config: DEFAULT_CREXTIO_CONFIG,
    }).then(res => {
      if (res?.version) {
        crextioVersionRef.current = Number(res.version);
        setCrextioConfig(curr => {
          const updated = { ...curr, _baseVersion: res.version };
          crextioStateRef.current = updated;
          return updated;
        });
      }
    }).catch(() => {});
  }, []);

  const updateMizanConfig = useCallback((updates: Partial<MizanDashboardConfig>) => {
    const prev = mizanStateRef.current;
    const next: MizanDashboardConfig = { ...prev, ...updates };
    mizanStateRef.current = next;
    setMizanConfig(next);

    const baseVer = mizanVersionRef.current || 1;
    api.saveThemeConfig({
      _target: 'mizan',
      _baseVersion: baseVer,
      config: next,
    }).then(res => {
      if (res?.version) {
        mizanVersionRef.current = Number(res.version);
      }
    }).catch(() => {});
  }, []);

  const resetMizanConfig = useCallback(() => {
    mizanStateRef.current = DEFAULT_MIZAN_CONFIG;
    setMizanConfig(DEFAULT_MIZAN_CONFIG);
    const baseVer = mizanVersionRef.current || 1;
    api.saveThemeConfig({
      _target: 'mizan',
      _baseVersion: baseVer,
      config: DEFAULT_MIZAN_CONFIG,
    }).then(res => {
      if (res?.version) {
        mizanVersionRef.current = Number(res.version);
      }
    }).catch(() => {});
  }, []);

  const [designTheme, setDesignThemeState] = useState<DesignThemeType>('crextio');
  const [isAlumniPreview, setIsAlumniPreview] = useState<boolean>(false);

  const toggleAlumniPreview = useCallback(() => {
    setIsAlumniPreview(prev => !prev);
  }, []);

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
    isAlumniPreview,
    setIsAlumniPreview,
    toggleAlumniPreview,
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
    isAlumniPreview,
    toggleAlumniPreview,
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
