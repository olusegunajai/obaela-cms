import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteSettings, settingsService } from '../services/settingsService';

interface SettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  getConsultationPrice: () => number;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = settingsService.subscribeToSettings((data) => {
      setSettings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getConsultationPrice = () => settings?.ecommerce?.consultationPrice || 15000;

  return (
    <SettingsContext.Provider value={{ settings, loading, getConsultationPrice }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
